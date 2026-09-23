// Fixture tests for the re-read classifier. Every transcript here is synthetic and built in-process:
// nothing under ~/.claude is read and no realpath is resolved, so these assertions hold on any
// machine and survive a corpus that changes under the live script.
//
// One fixture per distinction that decides a number. The classifier's whole value is that it says
// what it could not establish rather than guessing, so the cases that pin the *unresolved* classes
// carry as much weight here as the ones that pin `identical`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  classifyRereads, classifyRulePresence, recognizeCommand, summarize, makeScopePath, matchCorpus,
  deliveredRange,
  CLASSIFIER_VERSION, READ_ONCE_NEEDLE, SKILL_DELIVERY_ANCHOR, ALL_CLASSES, CLASS_GROUPS,
} from '../../scripts/measure-rereads.mjs';

// ---------------------------------------------------------------- transcript builder
let clock = 0;
let ids = 0;
const stamp = () => new Date(Date.UTC(2026, 8, 11, 10, 0, clock++)).toISOString();
function reset() { clock = 0; ids = 0; }

// A scope function with no filesystem behind it: anything under /repo is local, everything else is
// foreign, and the identity key is the resolved path either way.
const SCOPE = (cwd, raw) => {
  const absolute = raw.startsWith('/') ? raw : `${cwd || '/repo'}/${raw}`;
  const normalized = absolute.replace(/\/\.\//g, '/').replace(/[^/]+\/\.\.\//g, '');
  const inside = normalized === '/repo' || normalized.startsWith('/repo/');
  return {
    scope: inside ? 'local' : 'foreign',
    path: inside ? (normalized === '/repo' ? '.' : normalized.slice('/repo/'.length)) : null,
    key: `path\u0001${normalized}`,
    verified: true,
  };
};
const OPTIONS = { scopePath: SCOPE, cwd: '/repo' };

// One assistant turn holding `blocks`, plus one user record per result. `result` may be
// `{ text, isError }`, or `null` for a call whose result never arrived.
function turn(blocks, { id = null, usage = true } = {}) {
  const messageId = id || `msg-${ids++}`;
  const uses = blocks.map((b) => ({ ...b, id: b.id || `t${ids++}` }));
  const records = [{
    type: 'assistant',
    timestamp: stamp(),
    version: '2.1.268',
    message: {
      id: messageId,
      ...(usage ? { usage: { cache_read_input_tokens: 100_000 } } : {}),
      content: uses.map(({ result, ...use }) => ({ type: 'tool_use', ...use })),
    },
  }];
  // One record per result, because `toolUseResult` is a sibling of `message` and belongs to one
  // call — which is exactly how the harness writes it.
  for (const u of uses) {
    if (u.result === null || u.result === undefined) continue;
    const block = {
      type: 'tool_result',
      tool_use_id: u.id,
      content: u.result === true ? '' : (u.result.text ?? ''),
      ...(u.result !== true && u.result.isError ? { is_error: true } : {}),
    };
    records.push({
      type: 'user',
      timestamp: stamp(),
      message: { content: [block] },
      ...(u.result !== true && u.result.file ? { toolUseResult: { file: u.result.file } } : {}),
    });
  }
  return records;
}

const read = (file_path, result = true, extra = {}) =>
  ({ name: 'Read', input: { file_path, ...extra }, result });
const bash = (command, result = true) => ({ name: 'Bash', input: { command }, result });
const edit = (file_path, result = true) => ({ name: 'Edit', input: { file_path }, result });
const grep = (pattern, path, result = true) => ({ name: 'Grep', input: { pattern, path }, result });

// The harness's own skill-delivery record. `skill` names the directory it reports.
function delivery(skill, { withNeedle = true } = {}) {
  const body = `${SKILL_DELIVERY_ANCHOR} /home/x/esquisse/plugin/skills/${skill}\n\n`
    + (withNeedle ? `${READ_ONCE_NEEDLE} Across 158 recorded esq runs…\n` : 'Some other paragraph.\n');
  return [{
    type: 'user', isMeta: true, timestamp: stamp(),
    message: { content: [{ type: 'text', text: body }] },
  }];
}

const classify = (entries, options = OPTIONS) => classifyRereads(entries, options);

// ---------------------------------------------------------------- established redundancy
test('a second Read of the same path is one established repeat', () => {
  reset();
  const out = classify([...turn([read('/repo/docs/BACKLOG.md')]), ...turn([read('/repo/docs/BACKLOG.md')])]);
  assert.equal(out.repeats, 1);
  assert.equal(out.byClass.identical, 1);
  assert.deepEqual(out.offenders, { 'docs/BACKLOG.md': 1 });
  assert.equal(out.accessCalls, 2, 'both accesses count in the denominator');
});

test('a cohort with zero established redundancy is a complete reading, not an empty one', () => {
  reset();
  const out = classify([...turn([read('/repo/a.md')]), ...turn([read('/repo/b.md')])]);
  assert.equal(out.repeats, 0);
  assert.equal(out.byClass.identical, 0);
  assert.equal(out.accessCalls, 2);
  const summary = summarize([{ ...out, command: 'build', scope: 'local' }], context());
  assert.equal(summary.rows[0].eligibleRuns, 1, 'a run that accessed a path is eligible');
  assert.equal(summary.rows[0].redundantPerRun, 0, 'zero is a value, never null');
  assert.equal(summary.rows[0].classificationCoverage, null, 'no repeats means no coverage ratio to state');
});

// ---------------------------------------------------------------- the write exception
test('a Read after this run wrote that file is not a repeat', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/docs/BACKLOG.md')]),
    ...turn([edit('/repo/docs/BACKLOG.md')]),
    ...turn([read('/repo/docs/BACKLOG.md')]),
  ]);
  assert.equal(out.repeats, 0, 'the rule\'s own exception: you wrote to that file yourself since');
});

test('a Read after a successful esq CLI write to that plan is not a repeat', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/docs/plans/p.md')]),
    ...turn([bash("esq plan append-log docs/plans/p.md '{}'", { text: '{"ok":true}' })]),
    ...turn([read('/repo/docs/plans/p.md')]),
  ]);
  assert.equal(out.repeats, 0);
});

test('a Read after a FAILED single esq CLI write is still a repeat', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/docs/plans/p.md')]),
    ...turn([bash('esq plan append-log docs/plans/p.md bad', { text: 'refused', isError: true })]),
    ...turn([read('/repo/docs/plans/p.md')]),
  ]);
  assert.equal(out.byClass.identical, 1, 'a refused write left the file byte-identical');
  assert.equal(out.byClass.afterUncertainWrite, 0);
});

test('a recognized write with no recorded result is uncertain, never a reset and never redundancy', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/docs/BACKLOG.md')]),
    ...turn([bash('esq backlog set-status B-001 Done', null)]),
    ...turn([read('/repo/docs/BACKLOG.md')]),
  ]);
  assert.equal(out.byClass.afterUncertainWrite, 1);
  assert.equal(out.byClass.identical, 0);
});

test('a FAILED COMPOUND write may have written before failing, so it is uncertain', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/docs/BACKLOG.md')]),
    ...turn([bash('esq backlog set-status B-001 Done && false', { text: 'boom', isError: true })]),
    ...turn([read('/repo/docs/BACKLOG.md')]),
  ]);
  assert.equal(out.byClass.afterUncertainWrite, 1);
  assert.equal(out.byClass.identical, 0);
});

test('an interpreter heredoc marks the paths it names unresolved, and parses no shell', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/docs/SPEC.md')]),
    ...turn([bash('python3 - <<PY\nopen("docs/SPEC.md","w").write(x)\nPY')]),
    ...turn([read('/repo/docs/SPEC.md')]),
  ]);
  assert.equal(out.byClass.afterUnrecognizedWrite, 1);
  assert.equal(out.byClass.identical, 0);
});

test('a mass working-tree mutation makes the whole run historyIncomplete from that point', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/a.md'), read('/repo/b.md')]),
    ...turn([bash('git checkout main')]),
    ...turn([read('/repo/a.md')]),
    ...turn([read('/repo/b.md')]),
  ]);
  assert.equal(out.byClass.historyIncomplete, 2);
  assert.equal(out.byClass.identical, 0);
});

// ---------------------------------------------------------------- legitimate access
test('two slices whose results prove nothing about overlap are UNRESOLVED, not legitimate', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/big.md', true, { offset: 1, limit: 50 })]),
    ...turn([read('/repo/big.md', true, { offset: 51, limit: 50 })]),
  ]);
  assert.equal(out.byClass.overlapUnknown, 1);
  assert.equal(out.byClass.identical, 0);
  assert.ok(CLASS_GROUPS.unresolved.includes('overlapUnknown'));
  assert.ok(!CLASS_GROUPS.legitimate.includes('overlapUnknown'));
});

test('a re-access after a truncated result is recovery, not redundancy', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/big.md', { text: 'first lines…\n[truncated]' })]),
    ...turn([read('/repo/big.md')]),
  ]);
  assert.equal(out.byClass.afterTruncation, 1);
  assert.equal(out.byClass.identical, 0);
});

test('a first read whose result is missing never establishes that content was received', () => {
  reset();
  const out = classify([...turn([read('/repo/a.md', null)]), ...turn([read('/repo/a.md')])]);
  assert.equal(out.byClass.afterUnconfirmedRead, 1);
  assert.equal(out.byClass.identical, 0);
});

test('a first read whose result is an error never establishes it either', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/a.md', { text: 'File does not exist', isError: true })]),
    ...turn([read('/repo/a.md')]),
  ]);
  assert.equal(out.byClass.afterUnconfirmedRead, 1);
  assert.equal(out.byClass.identical, 0);
});

// ---------------------------------------------------------------- shared history across tools
test('a shell cat of a path a Read already fetched is a repeat — switching tool hides nothing', () => {
  reset();
  const out = classify([...turn([read('/repo/docs/SPEC.md')]), ...turn([bash('cat docs/SPEC.md')])]);
  assert.equal(out.byClass.identical, 1);
  assert.deepEqual(out.offenders, { 'docs/SPEC.md': 1 });
});

test('a repeated identical Grep is a repeat; a different pattern over the same path is not', () => {
  reset();
  const same = classify([...turn([grep('needle', '/repo/src')]), ...turn([grep('needle', '/repo/src')])]);
  assert.equal(same.byClass.identical, 1);
  reset();
  const other = classify([...turn([grep('needle', '/repo/src')]), ...turn([grep('other', '/repo/src')])]);
  assert.equal(other.repeats, 0, 'a search is identified by its whole invocation');
});

// ---------------------------------------------------------------- calls, turns, dedupe
test('one tool_use id written into two records counts once', () => {
  reset();
  const first = turn([read('/repo/a.md')], { id: 'msg-batched' });
  const duplicate = JSON.parse(JSON.stringify(first[0]));
  const out = classify([...first, duplicate]);
  assert.equal(out.toolCalls, 1);
  assert.equal(out.turns, 1, 'usage on a repeated message.id is taken once, never summed');
  assert.equal(out.cacheRead, 100_000);
});

test('two repeats in one turn are one turnWithRepeat', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/a.md'), read('/repo/b.md')]),
    ...turn([read('/repo/a.md'), read('/repo/b.md')], { id: 'msg-both' }),
  ]);
  assert.equal(out.repeats, 2);
  assert.equal(out.turnsWithRepeat, 1);
  assert.equal(out.repeatOnlyTurns, 1, 'every call in that turn was established redundancy');
});

test('a turn mixing redundancy with an unprovable slice is NOT a removable-turn candidate', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/a.md'), read('/repo/big.md', true, { offset: 1, limit: 5 })]),
    ...turn([read('/repo/a.md'), read('/repo/big.md', true, { offset: 6, limit: 5 })], { id: 'msg-mixed' }),
  ]);
  assert.equal(out.turnsWithRepeat, 1);
  assert.equal(out.repeatOnlyTurns, 0);
});

test('a turn mixing redundancy with an unresolved class is NOT a candidate', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/a.md'), read('/repo/b.md', null)]),
    ...turn([read('/repo/a.md'), read('/repo/b.md')], { id: 'msg-unresolved' }),
  ]);
  assert.equal(out.byClass.afterUnconfirmedRead, 1);
  assert.equal(out.repeatOnlyTurns, 0);
});

test('a turn mixing redundancy with other work is NOT a candidate', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/a.md')]),
    ...turn([read('/repo/a.md'), bash('npm test')], { id: 'msg-work' }),
  ]);
  assert.equal(out.byClass.identical, 1);
  assert.equal(out.turnsWithRepeat, 1);
  assert.equal(out.repeatOnlyTurns, 0, 'the suite run is work, not a removable call');
});

// ---------------------------------------------------------------- rule presence
test('rule presence is five-valued and never reads missing evidence as an absent rule', () => {
  const anchored = (skill, hasNeedle, toolCallsBefore) => ({ skill, hasNeedle, toolCallsBefore });
  assert.equal(classifyRulePresence([]).value, 'ruleUnknown');
  assert.equal(classifyRulePresence([anchored('plan', false, 1)]).value, 'ruleNotCarried');
  assert.equal(classifyRulePresence([anchored('build', false, 1)]).value, 'ruleAbsent');
  assert.equal(classifyRulePresence([anchored('build', true, 1)]).value, 'ruleLoaded');
  assert.equal(classifyRulePresence([anchored('build', true, 0)]).value, 'ruleLoaded');
  assert.equal(classifyRulePresence([anchored('build', true, 2)]).value, 'ruleLoadedMidRun');
  assert.equal(classifyRulePresence([anchored('build', true, 5)]).value, 'ruleLoadedMidRun');
});

test('the needle in a delivery record sets ruleLoaded; the same needle in a tool_result does not', () => {
  reset();
  const loaded = classify([...delivery('build'), ...turn([read('/repo/a.md')])]);
  assert.equal(loaded.rulePresence, 'ruleLoaded');
  assert.deepEqual(loaded.deliveredSkills, ['build']);

  reset();
  const readIt = classify([
    ...turn([read('/repo/plugin/skills/build/SKILL.md', { text: `x ${READ_ONCE_NEEDLE} y` })]),
  ]);
  assert.equal(readIt.rulePresence, 'ruleUnknown', 'an agent that merely read a SKILL.md proves nothing');
});

test('a delivery record without the needle is ruleAbsent only for a block-carrying skill', () => {
  reset();
  assert.equal(classify([...delivery('build', { withNeedle: false })]).rulePresence, 'ruleAbsent');
  reset();
  assert.equal(classify([...delivery('plan', { withNeedle: false })]).rulePresence, 'ruleNotCarried');
  reset();
  assert.equal(classify([...delivery('plan', { withNeedle: true })]).rulePresence, 'ruleNotCarried');
});

test('two tool calls before the delivery record is ruleLoadedMidRun', () => {
  reset();
  const out = classify([
    ...turn([bash('git status'), bash('ls')]),
    ...delivery('build'),
    ...turn([read('/repo/a.md')]),
  ]);
  assert.equal(out.rulePresence, 'ruleLoadedMidRun', 'earlier activity was not exposed to the rule');
});

// ---------------------------------------------------------------- the path boundary
test('a path is published only when the path itself resolves inside this repository', () => {
  reset();
  const cases = [
    ['/repo/docs/OK.md', 'docs/OK.md'],
    ['/etc/passwd', null],
    ['/repo/../outside/secrets.md', null],
  ];
  for (const [raw, published] of cases) {
    const scoped = SCOPE('/repo', raw);
    assert.equal(scoped.path, published, `${raw} publishes as ${published}`);
  }
});

test('repeats on an unpublishable path are counted and never named, in text and in JSON', () => {
  reset();
  const out = classify([...turn([read('/etc/passwd')]), ...turn([read('/etc/passwd')])]);
  assert.equal(out.byClass.identical, 1, 'it still counts toward the rate');
  assert.equal(out.withheldPaths, 1);
  assert.deepEqual(out.offenders, {}, 'and it is never named');
  const serialized = JSON.stringify(summarize([{ ...out, command: 'build', scope: 'foreign' }], context()));
  assert.ok(!serialized.includes('passwd'), '--json carries the same boundary as the render');
});

test('a symlink pointing out of the repository is foreign, because realpath decides', () => {
  // The real scope function, with realpath stubbed: /repo/link resolves to /elsewhere/file.
  const scopePath = makeScopePath('/repo', (p) => (p === '/repo/link' ? '/elsewhere/file' : p));
  assert.equal(scopePath('/repo', 'link').scope, 'foreign');
  assert.equal(scopePath('/repo', 'link').path, null);
  assert.equal(scopePath('/repo', 'docs/a.md').path, 'docs/a.md');
  assert.equal(scopePath('/repo', '/repo').path, '.', 'the repository root is inside the repository');
});

// ---------------------------------------------------------------- malformed and boundary input
test('a tool_use with no input and a result-less transcript survive as zeroes', () => {
  reset();
  const out = classify([
    { type: 'assistant', timestamp: stamp(), message: { id: 'm', usage: {}, content: [{ type: 'tool_use', id: 'x', name: 'Read' }] } },
    { type: 'assistant', timestamp: stamp(), message: { id: 'm2', content: 'a string, not blocks' } },
    { type: 'user', timestamp: stamp(), message: null },
    {},
  ]);
  assert.equal(out.repeats, 0);
  assert.equal(out.toolCalls, 1);
  assert.equal(out.accessCalls, 0, 'a Read with no file_path accesses nothing');
});

test('summarize reports an empty corpus rather than a rate of zero', () => {
  const summary = summarize([], context());
  assert.deepEqual(summary.rows, []);
  assert.equal(summary.corpus.matchCoverage, null);
  assert.equal(summary.classifierVersion, CLASSIFIER_VERSION);
});

// ---------------------------------------------------------------- cohorts
test('scopes and commands are separate cells, never pooled into one headline', () => {
  const runs = [
    { ...classify([...turn([read('/repo/a.md')]), ...turn([read('/repo/a.md')])]), command: 'build', scope: 'local' },
    { ...classify([...turn([read('/x/b.md')]), ...turn([read('/x/b.md')])]), command: 'build', scope: 'foreign' },
    { ...classify([...turn([read('/repo/c.md')])]), command: 'check', scope: 'local' },
  ];
  const summary = summarize(runs, context());
  assert.equal(summary.rows.length, 3, 'three cells, and no fourth row summing them');
  const keys = summary.rows.map((r) => `${r.command}/${r.scope}`).sort();
  assert.deepEqual(keys, ['build/foreign', 'build/local', 'check/local']);
  assert.ok(!Object.keys(summary).includes('overall'), 'there is no pooled figure to be lower');
});

test('classification coverage is stated apart from the redundancy count', () => {
  reset();
  const run = classify([
    ...turn([read('/repo/a.md')]), ...turn([read('/repo/a.md')]),            // identical
    ...turn([read('/repo/b.md', null)]), ...turn([read('/repo/b.md')]),      // unresolved
  ]);
  const row = summarize([{ ...run, command: 'build', scope: 'local' }], context()).rows[0];
  assert.equal(row.repeats, 2);
  assert.equal(row.byClass.identical, 1);
  assert.equal(row.classificationCoverage, 0.5, 'half the repeats could be resolved');
  assert.equal(row.redundantPerRun, 1, 'and the redundancy count is not discounted by that');
});

test('every class belongs to exactly one reported group', () => {
  const grouped = [...CLASS_GROUPS.redundant, ...CLASS_GROUPS.legitimate, ...CLASS_GROUPS.unresolved];
  assert.deepEqual([...grouped].sort(), [...ALL_CLASSES].sort());
  assert.equal(new Set(grouped).size, grouped.length);
});

// ---------------------------------------------------------------- the recognizer, directly
test('the command recognizer resolves what it can and flags what it cannot', () => {
  assert.deepEqual(recognizeCommand('cat docs/A.md').reads,
    [{ path: 'docs/A.md', slice: '', confirms: true }]);
  assert.deepEqual(recognizeCommand('node x.mjs > /tmp/out.log 2>&1').writes, ['/tmp/out.log']);
  assert.deepEqual(recognizeCommand('cp a/b.md c/d.md').writes, ['c/d.md']);
  assert.deepEqual(recognizeCommand('esq backlog add --type bug').writes, ['docs/BACKLOG.md']);
  assert.equal(recognizeCommand('git reset --hard').massMutation, true);
  assert.equal(recognizeCommand('git commit -m x').massMutation, false, 'a commit is not a working-tree rewrite');
  assert.equal(recognizeCommand('a && b').compound, true);
  assert.equal(recognizeCommand('node scripts/x.mjs').compound, false);
  assert.deepEqual(recognizeCommand('node -e \'require("docs/z.json")\'').unresolved, ['docs/z.json']);
});

// ---------------------------------------------------------------- v2 regressions
// Five false positives reproduced by independent synthetic probes against v1. Each one made the
// instrument claim redundancy it had not established, so each has a fixture here holding it shut.

test('REGRESSION: head -n 5 then cat is not the same access', () => {
  reset();
  const out = classify([...turn([bash('head -n 5 docs/a.md')]), ...turn([bash('cat docs/a.md')])]);
  assert.equal(out.byClass.identical, 0, 'five lines did not establish the whole file');
  assert.equal(out.byClass.overlapUnknown, 1, 'no shell result records a delivered range');
  assert.equal(out.repeatOnlyTurns, 0);
});

test('REGRESSION: two sed ranges over one file are two slices, not a repeat', () => {
  reset();
  const out = classify([
    ...turn([bash("sed -n '1,10p' docs/a.md")]),
    ...turn([bash("sed -n '11,20p' docs/a.md")]),
  ]);
  assert.equal(out.byClass.identical, 0);
  assert.equal(out.byClass.overlapUnknown, 1);
  assert.equal(out.repeatOnlyTurns, 0);
});

test('wc returns a count and never the bytes, so it establishes no content', () => {
  reset();
  const out = classify([...turn([bash('wc -l docs/a.md')]), ...turn([bash('cat docs/a.md')])]);
  assert.equal(out.byClass.identical, 0);
  assert.equal(out.byClass.afterUnconfirmedRead, 1);
});

test('whole-file equivalence survives: cat after cat, and cat after a whole-file Read', () => {
  reset();
  assert.equal(classify([...turn([bash('cat docs/a.md')]), ...turn([bash('cat docs/a.md')])]).byClass.identical, 1);
  reset();
  assert.equal(classify([...turn([read('/repo/docs/a.md')]), ...turn([bash('cat docs/a.md')])]).byClass.identical, 1);
});

test('REGRESSION: `cat f && npm test` re-reads AND works — counted, but never removable', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/docs/a.md')]),
    ...turn([bash('cat docs/a.md && npm test')]),
  ]);
  assert.equal(out.byClass.identical, 1, 'the repeated access is still counted');
  assert.equal(out.repeatOnlyTurns, 0, 'but the suite run is work the turn cannot shed');
  assert.equal(recognizeCommand('cat docs/a.md && npm test').fullyAccountedReads, false);
  assert.equal(recognizeCommand('cat docs/a.md').fullyAccountedReads, true);
  assert.equal(recognizeCommand('cat docs/a.md | head -3').fullyAccountedReads, false, 'a pipeline is unaccounted');
  assert.equal(recognizeCommand('cat docs/a.md > /tmp/x').fullyAccountedReads, false, 'a redirection has a side effect');
});

test('REGRESSION: a search identity carries every option that changes the answer', () => {
  reset();
  const modes = classify([
    ...turn([{ name: 'Grep', input: { path: '/repo/docs/a.md', pattern: 'foo', output_mode: 'files_with_matches' }, result: true }]),
    ...turn([{ name: 'Grep', input: { path: '/repo/docs/a.md', pattern: 'foo', output_mode: 'content' }, result: true }]),
  ]);
  assert.equal(modes.byClass.identical, 0, 'the two requests return different information');
  assert.equal(modes.repeats, 0);
  assert.equal(modes.repeatOnlyTurns, 0);

  reset();
  const same = classify([
    ...turn([{ name: 'Grep', input: { path: '/repo/docs/a.md', pattern: 'foo', output_mode: 'content' }, result: true }]),
    ...turn([{ name: 'Grep', input: { path: '/repo/docs/a.md', pattern: 'foo', output_mode: 'content' }, result: true }]),
  ]);
  assert.equal(same.byClass.identical, 1, 'the identical request twice is still a repeat');
});

test('REGRESSION: a write invalidates search history, not merely the path key it named', () => {
  reset();
  const out = classify([
    ...turn([grep('foo', '/repo/docs')]),
    ...turn([edit('/repo/other.md')]),
    ...turn([grep('foo', '/repo/docs')]),
  ]);
  assert.equal(out.byClass.identical, 0, 'a directory search can cover the file that was written');
  assert.equal(out.repeats, 0);
});

test('a shell grep over a file is a search, not a delivery of that file', () => {
  reset();
  const out = classify([...turn([read('/repo/docs/a.md')]), ...turn([bash('grep -n foo docs/a.md')])]);
  assert.equal(out.byClass.identical, 0, 'grep returns matching lines, never the file');
  reset();
  const twice = classify([...turn([bash('grep -n foo docs/a.md')]), ...turn([bash('grep -n foo docs/a.md')])]);
  assert.equal(twice.byClass.identical, 1, 'the same grep twice is a repeat');
});

// ---------------------------------------------------------------- v3 regressions
// Redundancy is decided by the range a call DELIVERED, read from toolUseResult.file, never by the
// shape of the request. v2 inferred a whole file from the absence of offset/limit and published
// every slice inequality as legitimate; both claims were unearned.

// A Read whose result records the range it delivered. `complete` builds the 1..total case.
const ranged = (file_path, file, extra = {}) =>
  ({ name: 'Read', input: { file_path, ...extra }, result: { text: '', file } });
const complete = (total) => ({ startLine: 1, numLines: total, totalLines: total });

test('REGRESSION: a slice of a PROVEN complete delivery is established redundancy', () => {
  reset();
  const out = classify([
    ...turn([ranged('/repo/big.md', complete(200))]),
    ...turn([ranged('/repo/big.md', { startLine: 10, numLines: 20, totalLines: 200 }, { offset: 10, limit: 20 })]),
  ]);
  assert.equal(out.byClass.identical, 1, 'lines 10-29 were already delivered in full');
  assert.equal(out.byClass.overlapUnknown, 0);
  assert.deepEqual(out.offenders, { 'big.md': 1 });
});

test('REGRESSION: the same pair is UNRESOLVED when the prior result proves no range', () => {
  reset();
  const out = classify([
    ...turn([read('/repo/big.md')]),                                   // whole-file REQUEST, no range
    ...turn([ranged('/repo/big.md', { startLine: 10, numLines: 20, totalLines: 200 }, { offset: 10, limit: 20 })]),
  ]);
  assert.equal(out.byClass.identical, 0, 'absence of offset/limit is not proof of a full delivery');
  assert.equal(out.byClass.overlapUnknown, 1);
});

test('a delivery reaching lines the prior did not is legitimate, and proven so', () => {
  reset();
  const out = classify([
    ...turn([ranged('/repo/big.md', { startLine: 1, numLines: 20, totalLines: 200 }, { offset: 1, limit: 20 })]),
    ...turn([ranged('/repo/big.md', complete(200))]),
  ]);
  assert.equal(out.byClass.broaderAccess, 1);
  assert.equal(out.byClass.identical, 0);
  assert.ok(CLASS_GROUPS.legitimate.includes('broaderAccess'));
});

test('two proven ranges that do not overlap are broaderAccess, never redundancy', () => {
  reset();
  const out = classify([
    ...turn([ranged('/repo/big.md', { startLine: 1, numLines: 10, totalLines: 200 }, { offset: 1, limit: 10 })]),
    ...turn([ranged('/repo/big.md', { startLine: 100, numLines: 10, totalLines: 200 }, { offset: 100, limit: 10 })]),
  ]);
  assert.equal(out.byClass.broaderAccess, 1);
  assert.equal(out.byClass.identical, 0);
});

test('a token-capped result proves no complete delivery', () => {
  reset();
  const out = classify([
    ...turn([ranged('/repo/big.md', { startLine: 1, numLines: 200, totalLines: 200, truncatedByTokenCap: true })]),
    ...turn([ranged('/repo/big.md', { startLine: 10, numLines: 5, totalLines: 200 }, { offset: 10, limit: 5 })]),
  ]);
  assert.equal(out.byClass.identical, 0);
  assert.equal(out.byClass.overlapUnknown, 1);
});

test('deliveredRange refuses every shape that cannot place a range', () => {
  assert.deepEqual(deliveredRange({ file: complete(786) }), { from: 1, to: 786, complete: true });
  assert.deepEqual(deliveredRange({ file: { startLine: 31, numLines: 1, totalLines: 786 } }),
    { from: 31, to: 31, complete: false });
  assert.equal(deliveredRange({ file: { startLine: 1, numLines: 10, totalLines: 10, truncatedByTokenCap: true } }), null);
  assert.equal(deliveredRange({ file: { startLine: 0, numLines: 10, totalLines: 10 } }), null, 'startLine 0');
  assert.equal(deliveredRange({ file: { numLines: 10, totalLines: 10 } }), null, 'no startLine');
  assert.equal(deliveredRange({ file: {} }), null);
  assert.equal(deliveredRange({}), null, 'no file object');
  assert.equal(deliveredRange(undefined), null, 'no toolUseResult at all');
  // totalLines absent: the range is placeable, completeness is not.
  assert.deepEqual(deliveredRange({ file: { startLine: 1, numLines: 10 } }), { from: 1, to: 10, complete: false });
});

test('the delivered range reads four keys and never the file content beside them', () => {
  reset();
  const secret = 'SHOULD-NEVER-LEAVE-THE-PROCESS';
  const file = { ...complete(3), content: secret, filePath: '/repo/big.md' };
  assert.deepEqual(deliveredRange({ file }), { from: 1, to: 3, complete: true });
  const out = classify([
    ...turn([ranged('/repo/big.md', file)]),
    ...turn([ranged('/repo/big.md', { startLine: 2, numLines: 1, totalLines: 3 }, { offset: 2, limit: 1 })]),
  ]);
  assert.equal(out.byClass.identical, 1);
  assert.ok(!JSON.stringify(out).includes(secret), 'no file content reaches the classifier output');
});

test('REGRESSION: cat SRC > DST delivers nothing to the agent', () => {
  reset();
  const twice = classify([
    ...turn([bash('cat docs/a.md > /tmp/x')]),
    ...turn([bash('cat docs/a.md > /tmp/y')]),
  ]);
  assert.equal(twice.accessCalls, 0, 'neither call put content in front of the agent');
  assert.equal(twice.repeats, 0, 'and neither can be redundant with the other');

  reset();
  const thenRead = classify([...turn([bash('cat docs/a.md > /tmp/x')]), ...turn([read('/repo/docs/a.md')])]);
  assert.equal(thenRead.accessCalls, 1, 'only the Read delivered anything');
  assert.equal(thenRead.repeats, 0, 'the redirected call seeded no history to repeat');

  const seen = recognizeCommand('cat docs/a.md > /tmp/x');
  assert.deepEqual(seen.reads, [], 'the source is not a content access');
  assert.deepEqual(seen.writes, ['/tmp/x'], 'the write still lands where its outcome supports it');
});

test('stderr redirection is not stdout redirection, and a redirect target is not an operand', () => {
  reset();
  assert.equal(classify([...turn([bash('cat docs/a.md 2>&1')]), ...turn([bash('cat docs/a.md')])]).byClass.identical,
    1, 'the agent saw the file both times');
  assert.deepEqual(recognizeCommand('cat docs/a.md 2> /tmp/err').reads.map((r) => r.path), ['docs/a.md'],
    'the error log is not something the command read');
  assert.deepEqual(recognizeCommand('grep -n foo docs/a.md > /tmp/x').searches, [],
    'a redirected search delivers nothing either');
});

// ---------------------------------------------------------------- the production path boundary
// A fake scope callback cannot test this: the defect was in the realpath failure handler itself,
// which a stub replaces. These build a real temporary tree instead.
test('REGRESSION: containment must be VERIFIED — an unresolvable path is never published', (t) => {
  const base = mkdtempSync(join(tmpdir(), 'esq-reread-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const repo = join(base, 'repo');
  const outside = join(base, 'outside');
  mkdirSync(join(repo, 'docs'), { recursive: true });
  mkdirSync(outside, { recursive: true });
  writeFileSync(join(repo, 'docs', 'real.md'), '# real\n');
  writeFileSync(join(outside, 'secret.md'), '# secret\n');
  symlinkSync(outside, join(repo, 'out'));          // a symlink pointing out of the tree

  const scopePath = makeScopePath(repo);            // the production realpath, not a stub

  const verified = scopePath(repo, 'docs/real.md');
  assert.equal(verified.path, join('docs', 'real.md'), 'a verified local path still publishes');
  assert.equal(verified.scope, 'local');

  const missingParent = scopePath(repo, 'esq-missing-parent-918273/a.md');
  assert.equal(missingParent.path, null, 'a path that does not resolve is not proven to be ours');
  assert.equal(missingParent.verified, false);
  assert.ok(missingParent.key, 'identity is still keyed, internally');

  const throughLink = scopePath(repo, 'out/secret.md');
  assert.equal(throughLink.path, null, 'realpath follows the symlink out of the tree');
  assert.equal(throughLink.scope, 'foreign');

  const missingUnderLink = scopePath(repo, 'out/nothing-here-either.md');
  assert.equal(missingUnderLink.path, null, 'a missing target beneath an outward symlink stays withheld');
  assert.equal(missingUnderLink.verified, false);

  assert.equal(scopePath(repo, join(outside, 'secret.md')).path, null, 'an absolute path elsewhere');
  assert.equal(scopePath(repo, '../outside/secret.md').path, null, 'a ../ escape');
});

// ---------------------------------------------------------------- corpus accounting
test('REGRESSION: matching coverage is a property of the store, and takes no window', () => {
  const labels = new Set(['a', 'b', 'c', 'd']);
  const files = new Set(['a', 'b', 'c', 'z']);
  const match = matchCorpus(labels, files);
  assert.equal(match.labelledByEsq, 4);
  assert.equal(match.labelledWithTranscript, 3, 'd has no transcript — that is a genuine miss');
  assert.equal(match.matchCoverage, 0.75);
  assert.equal(match.unlabelledTranscripts, 1);
  assert.equal(matchCorpus.length, 2, 'it cannot take a window: it has nowhere to put one');

  // Narrowing the window changes the SELECTION and must leave matching coverage untouched.
  const wide = summarize([], context({ match, selected: 3, outsideWindow: 0 }));
  const narrow = summarize([], context({ match, selected: 1, outsideWindow: 2, through: '2026-01-01T00:00:00Z' }));
  assert.equal(wide.corpus.matchCoverage, narrow.corpus.matchCoverage);
  assert.equal(narrow.corpus.selection.selectedRuns, 1);
  assert.equal(narrow.corpus.selection.excludedByWindow, 2);
  assert.ok(narrow.corpus.selection.selectedFraction < wide.corpus.selection.selectedFraction,
    'the window moves selection, and selection alone');
  assert.equal(narrow.corpus.perCohortMatchCoverage, null,
    'an absent transcript has no command and no rule presence, so per-cohort coverage is not computable');
});

function context(overrides = {}) {
  return {
    since: null, through: '2026-09-11T00:00:00Z', versions: ['2.1.268'],
    transcriptsOnDisk: 0,
    match: matchCorpus(new Set(), new Set()),
    selected: 0, outsideWindow: 0,
    ...overrides,
  };
}
