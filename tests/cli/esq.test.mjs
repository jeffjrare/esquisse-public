import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, readdir, stat, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { LOG_ENTRY_SCHEMA, addRow, appendLog, briefDepth, briefPending, briefPlan, evidence, planContext, priForType, rankEdges, rankOrder, rankPlace, renderAppendLogHelp, renderEvidence, derive, reserveId, setPri, setStatus, state, validate } from '../../plugin/lib/cli.mjs';
import { nextPhase, parsePlan, parseVerified } from '../../plugin/lib/markdown.mjs';
import { DIRECT_SEGMENTS_NOTE, EXCLUDED_RUNS, RUN_ROW_KEYS, INTERRUPTED_RUNS_NOTE, MIN_SAMPLE_RUNS, PLUGIN_DATA_ENV_IGNORED_NOTE, TELEMETRY_OPT_OUT_NOTE, discoverTelemetryFiles, renderTelemetrySummary, spawnModelVerdict, summarizeTelemetry } from '../../plugin/lib/telemetry.mjs';

// `esq lane` appends a plan-identity declaration under `pluginDataRoot(environment)`, and this suite
// calls it dozens of times on fixture plans. Pin the whole file's default environment at a throwaway
// config dir before the first test: a run under a real Claude Code session has
// CLAUDE_CODE_SESSION_ID set, and without this the fixtures' slugs would land in that session's own
// declaration log and mis-identify its segments. Every test that asserts on the log passes its own
// environment explicitly and never reads this one.
process.env.CLAUDE_CONFIG_DIR = mkdtempSync(path.join(os.tmpdir(), 'esq-cli-config-'));

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-cli-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  await writeFile(path.join(root, 'docs/BACKLOG.md'), `# Backlog\n\n| ID | Date | Type | Pri | Summary | Source | Epic | Version | Status |\n|---|---|---|---|---|---|---|---|---|\n| B-001 | 2026-08-17 | bug | hi | first | manual | | | Open |\n| B-003 | 2026-08-17 | todo | | third | manual | | | Planned |\n`);
  await writeFile(path.join(root, 'docs/plans/work.md'), `# Work\n\n## Phases\n\n### Phase 1 — first\n- task\n\n### Phase 2 — second\n- task\n\n## Execution log\n<!-- Appended by /esq:build -->\n`);
  return root;
}

test('a backlog heading its id column "#" is read like one heading it "ID"', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-cli-hash-'));
  await mkdir(path.join(root, 'docs'), { recursive: true });
  const file = path.join(root, 'docs/BACKLOG.md');
  await writeFile(file, `# Backlog\n\n| # | Date | Type | Priority | Summary | Source | Epic | Status |\n|---|---|---|---|---|---|---|---|\n| B-001 | 2026-08-18 | bug | | legacy header | manual | | Open |\n`);
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  assert.equal((await reserveId(root, file)).id, 'B-002');
  assert.equal((await setStatus(file, 'B-001', 'Done')).previous, 'Open');
  const result = await validate(root);
  assert.deepEqual(result.findings, []);
});

test('state reports git, the plans newest first with activePlan, and the backlog counts plus actionable rows', async () => {
  const root = await fixture();
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  // A second, phase-less plan touched later than work.md must lead plans[] and be activePlan.
  const newer = path.join(root, 'docs/plans/2026-08-19-notes.md');
  await writeFile(newer, '# Notes without phases\n');
  await utimes(path.join(root, 'docs/plans/work.md'), new Date('2026-08-01T00:00:00Z'), new Date('2026-08-01T00:00:00Z'));
  await utimes(newer, new Date('2026-08-19T00:00:00Z'), new Date('2026-08-19T00:00:00Z'));
  await writeFile(path.join(root, 'docs/BACKLOG.md'), `# Backlog\n\n| ID | Date | Type | Pri | Summary | Source | Epic | Version | Status |\n|---|---|---|---|---|---|---|---|---|\n| B-001 | 2026-08-17 | bug | hi | first | manual | | | Open |\n| B-002 | 2026-08-17 | debt | med | second | review | aug | | Needs-decision |\n| B-003 | 2026-08-17 | todo | | third | manual · Planned by x | | | Planned |\n| B-004 | 2026-08-17 | todo | lo | fourth | manual | | v1 | Done |\n`);
  const result = await state(root);
  assert.equal(result.dirty, false);
  assert.equal(result.activePlan, 'docs/plans/2026-08-19-notes.md');
  assert.deepEqual(result.plans.map((plan) => plan.file), ['docs/plans/2026-08-19-notes.md', 'docs/plans/work.md']);
  assert.equal(result.plans[0].state, 'no-phases');
  assert.equal(result.plans[0].mtime, '2026-08-19T00:00:00.000Z');
  assert.equal(result.plans[1].state, 'ready');
  assert.deepEqual(result.backlog.counts, { Open: 1, 'Needs-decision': 1, Planned: 1, Done: 1, Dropped: 0 });
  assert.deepEqual(result.backlog.rows, [
    { id: 'B-001', pri: 'hi', rank: '', summary: 'first', status: 'Open', epic: '', source: 'manual' },
    { id: 'B-002', pri: 'med', rank: '', summary: 'second', status: 'Needs-decision', epic: 'aug', source: 'review' },
    { id: 'B-003', pri: '', rank: '', summary: 'third', status: 'Planned', epic: '', source: 'manual · Planned by x' },
  ]);
  // No docs/ROADMAP.md at all → roadmap is null.
  assert.equal(result.roadmap, null);
  // Identical mtimes (a fresh clone) → filename descending decides.
  await utimes(path.join(root, 'docs/plans/work.md'), new Date('2026-08-19T00:00:00Z'), new Date('2026-08-19T00:00:00Z'));
  assert.deepEqual((await state(root)).plans.map((plan) => plan.file), ['docs/plans/work.md', 'docs/plans/2026-08-19-notes.md']);
});

test('state returns the roadmap head from the first `## Now` entry, and null when Now is empty', async () => {
  const root = await fixture();
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  const file = path.join(root, 'docs/ROADMAP.md');
  // Labels copied verbatim from plugin/skills/roadmap/SKILL.md's template; three entries so the head is the first one only.
  await writeFile(file, `# Roadmap\n\n<!-- GENERATED: every \`state:\` line -->\n\n## Now\n\n### dev-only-bumps\n**covers:** B-018, B-020\n**why now:** near-zero risk and it carries the whole dev-only share\n**unblocks:** redis-queue-trio\n**state:** <!-- GENERATED --> B-018 Open · B-020 Open — not started\n\n### second-entry\n**covers:** B-021\n**why now:** second\n**needs:** dev-only-bumps\n**state:** <!-- GENERATED --> B-021 Open — blocked (needs dev-only-bumps)\n\n## Next\n\n### third-entry\n**covers:** B-022\n**why now:** third\n**state:** <!-- GENERATED --> B-022 Open — not started\n\n## Later\n\n## Shipped\n`);
  const result = await state(root);
  assert.deepEqual({ file: result.roadmap.file, head: result.roadmap.head }, {
    file: 'docs/ROADMAP.md',
    head: {
      slug: 'dev-only-bumps',
      covers: 'B-018, B-020',
      whyNow: 'near-zero risk and it carries the whole dev-only share',
      needs: null,
      unblocks: 'redis-queue-trio',
      state: 'B-018 Open · B-020 Open — not started',
    },
  });
  // An empty `## Now` (Next still populated) → the file is known but there is no head.
  await writeFile(file, `# Roadmap\n\n## Now\n\n## Next\n\n### third-entry\n**covers:** B-022\n**why now:** third\n**state:** <!-- GENERATED --> B-022 Open — not started\n\n## Later\n`);
  const emptyNow = (await state(root)).roadmap;
  assert.equal(emptyNow.head, null);
  assert.deepEqual(emptyNow.entries.map((entry) => [entry.horizon, entry.slug]), [['Next', 'third-entry']]);
});

test('state lists a plan whose execution log duplicates a phase entry as invalid, with the message validate gives it', async () => {
  const root = await fixture();
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  const file = path.join(root, 'docs/plans/work.md');
  await appendLog(file, JSON.stringify({ phase: 1, status: 'completed', commits: ['abc1234'], whatBuilt: 'a thing', verification: ['ok'] }));
  // appendLog refuses the duplicate by design; a hand edit does not.
  await writeFile(file, (await readFile(file, 'utf8')) + '\n### Phase 1 — completed 2026-08-19\n\n**Commits:** abc1234\n');
  const result = await state(root);
  assert.equal(result.plans.length, 1);
  const [plan] = result.plans;
  assert.equal(plan.state, 'invalid');
  assert.equal(plan.error, 'duplicate execution-log entry for Phase 1');
  assert.equal(plan.file, 'docs/plans/work.md');
  assert.match(plan.mtime, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal('phase' in plan, false);
  assert.equal(result.activePlan, 'docs/plans/work.md');
  assert.deepEqual((await validate(root)).findings, ['docs/plans/work.md: duplicate execution-log entry for Phase 1']);
});

test('state lists a plan whose execution log cites a phase outside ## Phases as invalid, with the message validate gives it', async () => {
  const root = await fixture();
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  const file = path.join(root, 'docs/plans/work.md');
  await writeFile(file, (await readFile(file, 'utf8')) + '\n### Phase 9 — completed 2026-08-19\n\n**Commits:** abc1234\n');
  const result = await state(root);
  assert.deepEqual(result.plans.map(({ file: name, state: planState, error }) => ({ file: name, state: planState, error })), [
    { file: 'docs/plans/work.md', state: 'invalid', error: 'execution log references unknown Phase 9' },
  ]);
  assert.deepEqual((await validate(root)).findings, ['docs/plans/work.md: execution log references unknown Phase 9']);
});

test('state keeps classifying the healthy plans beside an invalid one, activePlan stays the newest file, and validate names the same fault', async () => {
  const root = await fixture();
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  const good = path.join(root, 'docs/plans/work.md');
  const bad = path.join(root, 'docs/plans/2026-08-19-broken.md');
  await writeFile(bad, `# Broken\n\n## Phases\n\n### Phase 1 — only\n- task\n\n## Execution log\n\n### Phase 2 — completed 2026-08-19\n\n**Commits:** abc1234\n`);
  await utimes(good, new Date('2026-08-01T00:00:00Z'), new Date('2026-08-01T00:00:00Z'));
  await utimes(bad, new Date('2026-08-19T00:00:00Z'), new Date('2026-08-19T00:00:00Z'));
  // The broken file is the newest, so it is activePlan — "most recently modified file", readable or not.
  let result = await state(root);
  assert.equal(result.activePlan, 'docs/plans/2026-08-19-broken.md');
  assert.deepEqual(result.plans.map((plan) => [plan.file, plan.state]), [['docs/plans/2026-08-19-broken.md', 'invalid'], ['docs/plans/work.md', 'ready']]);
  assert.equal(result.plans[0].error, 'execution log references unknown Phase 2');
  assert.equal(result.plans[1].phase.number, 1);
  assert.deepEqual((await validate(root)).findings, ['docs/plans/2026-08-19-broken.md: execution log references unknown Phase 2']);
  // Swap the mtimes: the valid plan leads and is activePlan; the invalid one is still listed, still invalid.
  await utimes(good, new Date('2026-08-20T00:00:00Z'), new Date('2026-08-20T00:00:00Z'));
  result = await state(root);
  assert.equal(result.activePlan, 'docs/plans/work.md');
  assert.deepEqual(result.plans.map((plan) => [plan.file, plan.state]), [['docs/plans/work.md', 'ready'], ['docs/plans/2026-08-19-broken.md', 'invalid']]);
  // Backlog and roadmap facts are untouched by a broken plan.
  assert.deepEqual(result.backlog.counts, { Open: 1, 'Needs-decision': 0, Planned: 1, Done: 0, Dropped: 0 });
});

test('state reports a backlog table without an ID header or without a Status column as backlog.error, plans and roadmap intact', async () => {
  const root = await fixture();
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  const file = path.join(root, 'docs/BACKLOG.md');
  await writeFile(path.join(root, 'docs/ROADMAP.md'), `# Roadmap\n\n## Now\n\n### head-entry\n**covers:** B-001\n**state:** <!-- GENERATED --> B-001 Open — not started\n\n## Next\n`);
  const original = await readFile(file, 'utf8');
  await writeFile(file, original.replace('| ID |', '| Ref |'));
  let result = await state(root);
  assert.deepEqual(result.backlog, { error: 'Markdown table with ID header not found' });
  assert.equal(result.activePlan, 'docs/plans/work.md');
  assert.equal(result.plans[0].state, 'ready');
  assert.equal(result.roadmap.head.slug, 'head-entry');
  await writeFile(file, original.replace('| Status |', '| State |'));
  result = await state(root);
  assert.deepEqual(result.backlog, { error: 'backlog table has no Status column' });
  assert.equal(result.plans[0].state, 'ready');
  assert.equal(result.roadmap.head.slug, 'head-entry');
  // A blank-ID row inside a well-formed table is validate's finding, not state's: the rows still come back.
  await writeFile(file, original + '|  | 2026-08-19 | bug | | blank id | manual | | | Open |\n');
  result = await state(root);
  assert.equal(result.backlog.error, undefined);
  assert.deepEqual(result.backlog.counts, { Open: 2, 'Needs-decision': 0, Planned: 1, Done: 0, Dropped: 0 });
  assert.deepEqual(result.backlog.rows.map((row) => row.id), ['B-001', 'B-003', '']);
  assert.match((await validate(root)).findings.join('\n'), /invalid backlog ID: /);
});

test('next-phase prioritizes a pause and then reports completion', async () => {
  const root = await fixture();
  const plan = 'docs/plans/work.md';
  const file = path.join(root, plan);
  await appendLog(file, JSON.stringify({ phase: 1, status: 'paused', commits: ['abc1234'], whatBuilt: 'half a thing', manualOutstanding: ['look'], verification: ['tests pass'] }));
  assert.equal(nextPhase(parsePlan(await readFile(file, 'utf8'))).state, 'paused');
  let text = await readFile(path.join(root, plan), 'utf8');
  text = text.replace('### Phase 1 — ⏸ awaiting manual verification', '### Phase 1 — completed');
  await writeFile(path.join(root, plan), text);
  await appendLog(file, JSON.stringify({ phase: 2, status: 'completed', commits: ['def5678'], whatBuilt: 'the rest', verification: ['tests pass'] }));
  assert.equal(nextPhase(parsePlan(await readFile(file, 'utf8'))).state, 'complete');
});

// ── `esq next-phase --context` ───────────────────────────────────────────────
// The response that replaces the skeleton grep and its dependent slice reads (B-161). Every
// assertion below names the expected source text literally rather than recomputing it with the
// helper under test, so a dropped line or a moved boundary reds rather than agreeing with itself.

// One plan carrying every boundary at once: a completed entry whose body must NOT come back, a `⏸`
// entry sitting above the newest one, a newest entry, and an appendix whose own `### Phase 9`
// heading is plan material rather than a fourth execution-log entry.
const CONTEXT_PLAN = [
  '# A plan',                                                                           // 1
  '',                                                                                   // 2
  '## Phases',                                                                          // 3
  '',                                                                                   // 4
  '### Phase 1 — first',                                                                // 5
  '- task',                                                                             // 6
  '',                                                                                   // 7
  '### Phase 2 — second',                                                               // 8
  '- task',                                                                             // 9
  '',                                                                                   // 10
  '### Phase 3 — third',                                                                // 11
  '- task',                                                                             // 12
  '',                                                                                   // 13
  '## Execution log',                                                                   // 14
  '<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->',// 15
  '',                                                                                   // 16
  '### Phase 1 — completed 2026-09-01',                                                 // 17
  '',                                                                                   // 18
  '**Plan committed at:** aaa1111',                                                     // 19
  '',                                                                                   // 20
  '**What got built:** SENTINEL-OLD-BODY-PHASE-ONE',                                    // 21
  '',                                                                                   // 22
  '### Phase 2 — ⏸ blocked on an open same-unit defect 2026-09-02',                     // 23
  '',                                                                                   // 24
  '**Plan committed at:** bbb2222',                                                     // 25
  '',                                                                                   // 26
  '**Blocked by:** B-900 (bug, Open) — the defect that paused it',                      // 27
  '',                                                                                   // 28
  '### Phase 3 — completed 2026-09-03',                                                 // 29
  '',                                                                                   // 30
  '**Plan committed at:** ccc3333',                                                     // 31
  '',                                                                                   // 32
  '**For Phase 4:** carry on',                                                          // 33
  '',                                                                                   // 34
  '## Appendix — the table the phases cite',                                            // 35
  '',                                                                                   // 36
  '### Phase 9 — a heading that looks like an entry',                                   // 37
  '',                                                                                   // 38
  'appendix body',                                                                      // 39
  '',
].join('\n');

// The context always accompanies a verdict, so every call here builds both from one parse — which is
// also what keeps a test from agreeing with a context computed for a different phase than the one
// `nextPhase` picked.
function contextOf(text) {
  const plan = parsePlan(text);
  const verdict = nextPhase(plan);
  return { plan, verdict, context: planContext(plan, verdict) };
}

test('--context returns the plan section, the pause, the newest entry and the appendix — and no old body', () => {
  const { context } = contextOf(CONTEXT_PLAN);

  assert.deepEqual(context.log, { line: 14, end: 34, appendix: 35 });
  assert.equal(context.completed, 2);
  assert.deepEqual(context.phases, [
    { number: 1, title: 'first', line: 5, status: 'completed' },
    { number: 2, title: 'second', line: 8, status: 'paused' },
    { number: 3, title: 'third', line: 11, status: 'completed' },
  ]);

  const sections = context.sections;
  assert.deepEqual(sections.map((section) => section.kind), ['plan', 'entry', 'entry', 'appendix']);

  // The plan section: `1 → L+1`, so the log heading and its append anchor are always in hand.
  assert.deepEqual([sections[0].from, sections[0].to], [1, 15]);
  assert.equal(sections[0].text, '# A plan\n\n## Phases\n\n### Phase 1 — first\n- task\n\n### Phase 2 — second\n- task\n\n### Phase 3 — third\n- task\n\n## Execution log\n<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->');

  // The `⏸` entry, above the newest one, verbatim — continuity field and blocker text included.
  assert.deepEqual([sections[1].kind, sections[1].phase, sections[1].status, sections[1].from, sections[1].to], ['entry', 2, 'paused', 23, 28]);
  assert.deepEqual(sections[1].roles, ['paused']);
  assert.equal(sections[1].text, '### Phase 2 — ⏸ blocked on an open same-unit defect 2026-09-02\n\n**Plan committed at:** bbb2222\n\n**Blocked by:** B-900 (bug, Open) — the defect that paused it\n');

  // The newest entry, to the end of the log span.
  assert.deepEqual([sections[2].phase, sections[2].status, sections[2].from, sections[2].to], [3, 'completed', 29, 34]);
  assert.deepEqual(sections[2].roles, ['newest']);
  assert.equal(sections[2].text, '### Phase 3 — completed 2026-09-03\n\n**Plan committed at:** ccc3333\n\n**For Phase 4:** carry on\n');

  // The appendix in full — its `### Phase 9` heading is plan material, never a fourth entry.
  assert.deepEqual([sections[3].from, sections[3].to], [35, 39]);
  assert.equal(sections[3].text, '## Appendix — the table the phases cite\n\n### Phase 9 — a heading that looks like an entry\n\nappendix body');

  // Phase 1's body was never selected, and nothing carries the raw parsed lines.
  const encoded = JSON.stringify(context);
  assert.equal(encoded.includes('SENTINEL-OLD-BODY-PHASE-ONE'), false);
  assert.equal(encoded.includes('**What got built:**'), false);
  assert.equal(Object.hasOwn(context, 'lines'), false);

  // Ranges are strictly increasing, so no line is delivered in two sections.
  for (let index = 1; index < sections.length; index += 1) {
    assert.ok(sections[index].from > sections[index - 1].to, `section ${index} overlaps the one before it`);
  }
});

test('--context on an empty log still hands back the heading and the append anchor', () => {
  const text = ['# A plan', '', '### Phase 1 — only', '- task', '', '## Execution log', '<!-- Appended by /esq:build -->', ''].join('\n');
  const { context } = contextOf(text);
  assert.deepEqual(context.log, { line: 6, end: 7, appendix: null });
  assert.equal(context.completed, 0);
  assert.deepEqual(context.sections.map((section) => section.kind), ['plan']);
  assert.deepEqual([context.sections[0].from, context.sections[0].to], [1, 7]);
  assert.equal(context.sections[0].text, '# A plan\n\n### Phase 1 — only\n- task\n\n## Execution log\n<!-- Appended by /esq:build -->');
});

test('--context with no execution-log marker preserves the full-file read', () => {
  const text = ['# A plan', '', '### Phase 1 — only', '- task', ''].join('\n');
  const { context } = contextOf(text);
  assert.deepEqual(context.log, { line: null, end: null, appendix: null });
  assert.deepEqual(context.sections.map((section) => section.kind), ['plan']);
  assert.deepEqual([context.sections[0].from, context.sections[0].to], [1, 4]);
  assert.equal(context.sections[0].text, '# A plan\n\n### Phase 1 — only\n- task');
});

test('--context returns one section when the pause is itself the newest entry', () => {
  const text = [
    '# A plan', '', '### Phase 1 — first', '- task', '', '### Phase 2 — second', '- task', '',
    '## Execution log', '<!-- Appended by /esq:build -->', '',
    '### Phase 1 — completed 2026-09-01', '', '**What got built:** SENTINEL-OLD-BODY-PHASE-ONE', '',
    '### Phase 2 — ⏸ awaiting manual verification 2026-09-02', '',
    '**Manual verification outstanding:**', '- [on /settings] toggle → expect: it repaints', '',
  ].join('\n');
  const { context } = contextOf(text);
  assert.deepEqual(context.sections.map((section) => section.kind), ['plan', 'entry']);
  assert.deepEqual(context.sections[1].roles, ['newest', 'paused']);
  assert.deepEqual([context.sections[1].phase, context.sections[1].from, context.sections[1].to], [2, 16, 19]);
  assert.equal(context.sections[1].text, '### Phase 2 — ⏸ awaiting manual verification 2026-09-02\n\n**Manual verification outstanding:**\n- [on /settings] toggle → expect: it repaints');
  assert.equal(JSON.stringify(context).includes('SENTINEL-OLD-BODY-PHASE-ONE'), false);
});

test('--context on a complete plan carries only the newest entry', () => {
  const text = [
    '# A plan', '', '### Phase 1 — first', '- task', '', '### Phase 2 — second', '- task', '',
    '## Execution log', '<!-- Appended by /esq:build -->', '',
    '### Phase 1 — completed 2026-09-01', '', '**What got built:** SENTINEL-OLD-BODY-PHASE-ONE', '',
    '### Phase 2 — completed 2026-09-02', '', '**For Phase 3:** none', '',
  ].join('\n');
  const { verdict, context } = contextOf(text);
  assert.equal(verdict.state, 'complete');
  assert.equal(context.completed, 2);
  assert.deepEqual(context.sections.map((section) => section.kind), ['plan', 'entry']);
  assert.deepEqual([context.sections[1].phase, context.sections[1].from, context.sections[1].to], [2, 16, 18]);
  assert.equal(context.sections[1].text, '### Phase 2 — completed 2026-09-02\n\n**For Phase 3:** none');
  assert.equal(JSON.stringify(context).includes('SENTINEL-OLD-BODY-PHASE-ONE'), false);
});

// A log appended out of phase order: Phase 2's pause was written first, Phase 1's second. Both
// parsers accept the file. `nextPhase` walks the *plan's* phases, so Phase 1 is the pause it
// classifies; a helper walking the log's insertion order would pick Phase 2. The context has to
// carry the body of the pause the response itself names, or the worker routes to Phase 1 holding
// Phase 2's text and never sees Phase 1's.
const OUT_OF_ORDER_PAUSES = [
  '# Plan',                                             // 1
  '### Phase 1 — first',                                // 2
  '### Phase 2 — second',                               // 3
  '### Phase 3 — third',                                // 4
  '## Execution log',                                   // 5
  '<!-- Appended by /esq:build -->',                    // 6
  '### Phase 2 — ⏸ awaiting manual verification',       // 7
  'SECOND-PAUSE-BODY',                                  // 8
  '### Phase 1 — ⏸ blocked on an open same-unit defect',// 9
  'FIRST-PAUSE-BODY',                                   // 10
  '### Phase 3 — completed',                            // 11
  'NEWEST-BODY',                                        // 12
].join('\n');

test('--context carries the body of the pause the verdict names, on a log appended out of phase order', () => {
  const { verdict, context } = contextOf(OUT_OF_ORDER_PAUSES);

  // The classification is preserved exactly: `nextPhase`'s plan-order priority still decides.
  assert.equal(verdict.state, 'paused');
  assert.equal(verdict.phase.number, 1);
  assert.equal(verdict.entry.number, 1);

  assert.deepEqual(context.sections.map((section) => [section.kind, section.phase ?? null]), [['plan', null], ['entry', 1], ['entry', 3]]);
  assert.deepEqual(context.sections[1].roles, ['paused']);
  assert.deepEqual([context.sections[1].from, context.sections[1].to], [9, 10]);
  assert.equal(context.sections[1].text, '### Phase 1 — ⏸ blocked on an open same-unit defect\nFIRST-PAUSE-BODY');
  assert.equal(context.sections[2].text, '### Phase 3 — completed\nNEWEST-BODY');

  // The pause that was *not* selected is an old entry like any other: its body stays out, rather
  // than every body being shipped to cover the disagreement.
  assert.equal(JSON.stringify(context).includes('SECOND-PAUSE-BODY'), false);
});

test('--context picks the same pause as the verdict when the log is in phase order, and on a single pause', () => {
  // Control 1 — two pauses, log written in phase order: both orderings agree on Phase 1, and the
  // second pause is still an old body that stays out.
  const inOrder = [
    '# Plan', '### Phase 1 — first', '### Phase 2 — second', '### Phase 3 — third',
    '## Execution log', '<!-- Appended by /esq:build -->',
    '### Phase 1 — ⏸ blocked on an open same-unit defect', 'FIRST-PAUSE-BODY',
    '### Phase 2 — ⏸ awaiting manual verification', 'SECOND-PAUSE-BODY',
    '### Phase 3 — completed', 'NEWEST-BODY',
  ].join('\n');
  const ordered = contextOf(inOrder);
  assert.equal(ordered.verdict.entry.number, 1);
  assert.deepEqual(ordered.context.sections.map((section) => section.phase ?? null), [null, 1, 3]);
  assert.equal(ordered.context.sections[1].text, '### Phase 1 — ⏸ blocked on an open same-unit defect\nFIRST-PAUSE-BODY');
  assert.equal(JSON.stringify(ordered.context).includes('SECOND-PAUSE-BODY'), false);

  // Control 2 — a single pause, out of insertion order with the completed entries around it.
  const single = [
    '# Plan', '### Phase 1 — first', '### Phase 2 — second', '### Phase 3 — third',
    '## Execution log', '<!-- Appended by /esq:build -->',
    '### Phase 1 — completed', 'FIRST-BODY',
    '### Phase 2 — ⏸ awaiting manual verification', 'ONLY-PAUSE-BODY',
    '### Phase 3 — completed', 'NEWEST-BODY',
  ].join('\n');
  const one = contextOf(single);
  assert.equal(one.verdict.entry.number, 2);
  assert.deepEqual(one.context.sections.map((section) => section.phase ?? null), [null, 2, 3]);
  assert.equal(one.context.sections[1].text, '### Phase 2 — ⏸ awaiting manual verification\nONLY-PAUSE-BODY');
  assert.equal(JSON.stringify(one.context).includes('FIRST-BODY'), false);

  // Control 3 — no pause at all: the newest entry is the only slice, whatever order the log is in.
  const none = contextOf(single.replace('### Phase 2 — ⏸ awaiting manual verification', '### Phase 2 — completed'));
  assert.equal(none.verdict.state, 'complete');
  assert.deepEqual(none.context.sections.map((section) => section.phase ?? null), [null, 3]);
});

test('planContext refuses to build a context with no verdict to build it for', () => {
  assert.throws(() => planContext(parsePlan(CONTEXT_PLAN)), /planContext requires the nextPhase verdict/);
});

test('--context gives the appendix the lines it owns when it abuts the log heading', () => {
  const text = ['# A plan', '', '### Phase 1 — only', '- task', '', '## Execution log', '## Appendix', 'body', ''].join('\n');
  const { context } = contextOf(text);
  assert.deepEqual(context.log, { line: 6, end: 6, appendix: 7 });
  assert.deepEqual(context.sections.map((section) => section.kind), ['plan', 'appendix']);
  assert.deepEqual([context.sections[0].from, context.sections[0].to], [1, 6]);
  assert.equal(context.sections[0].text, '# A plan\n\n### Phase 1 — only\n- task\n\n## Execution log');
  assert.deepEqual([context.sections[1].from, context.sections[1].to], [7, 8]);
  assert.equal(context.sections[1].text, '## Appendix\nbody');
});

// `esq plan append-log` does not require the reserved append-anchor comment, so a log can open
// directly on its first entry's `### ` heading. The plan slice used to take line `L+1`
// unconditionally and ate that heading — with it the `⏸` clause the routing classifies on, and on a
// heading-only entry the whole section. One builder, so each case differs only in the log's shape.
const anchorless = (...log) => ['# A plan', '', '### Phase 1 — only', '- task', '', '## Execution log', ...log, ''].join('\n');
const ANCHORLESS_PLAN_TEXT = '# A plan\n\n### Phase 1 — only\n- task\n\n## Execution log';

test('--context leaves an anchorless log its first entry heading, under every clause', () => {
  const cases = [
    ['### Phase 1 — completed 2026-09-01', 'completed', 'a completed entry with a body'],
    ['### Phase 1 — ⏸ awaiting manual verification 2026-09-01', 'paused', 'a pause awaiting manual verification'],
    ['### Phase 1 — ⏸ blocked on an open same-unit defect 2026-09-01', 'paused', 'a pause blocked on a same-unit defect'],
  ];
  for (const [heading, status, why] of cases) {
    const { context } = contextOf(anchorless(heading, '', '**What got built:** SENTINEL-BODY'));
    assert.deepEqual(context.sections.map((section) => section.kind), ['plan', 'entry'], why);

    // The plan section stops at the log heading — it carries no anchor, because there is none.
    assert.deepEqual([context.sections[0].from, context.sections[0].to], [1, 6], why);
    assert.equal(context.sections[0].text, ANCHORLESS_PLAN_TEXT, why);

    // The entry begins with its own heading, which is where the clause the routing reads lives.
    assert.deepEqual([context.sections[1].phase, context.sections[1].status], [1, status], why);
    assert.deepEqual([context.sections[1].from, context.sections[1].to], [7, 9], why);
    assert.equal(context.sections[1].text, `${heading}\n\n**What got built:** SENTINEL-BODY`, why);
  }
});

test('--context returns a heading-only entry on an anchorless log, which used to come back as nothing', () => {
  const { context } = contextOf(anchorless('### Phase 1 — ⏸ awaiting manual verification 2026-09-01'));
  assert.deepEqual(context.sections.map((section) => section.kind), ['plan', 'entry']);
  assert.deepEqual([context.sections[0].from, context.sections[0].to], [1, 6]);
  assert.equal(context.sections[0].text, ANCHORLESS_PLAN_TEXT);
  assert.deepEqual([context.sections[1].phase, context.sections[1].from, context.sections[1].to], [1, 7, 7]);
  assert.equal(context.sections[1].text, '### Phase 1 — ⏸ awaiting manual verification 2026-09-01');
});

test('--context still carries the anchor comment, and still stops at an appendix — the two controls, literal', () => {
  // Every plan `/esq:plan` authors carries the anchor, so this is the shape in the field: line `L+1`
  // is boilerplate, not a heading, and the plan section takes it exactly as it always has.
  const anchored = contextOf(CONTEXT_PLAN).context;
  assert.deepEqual([anchored.sections[0].from, anchored.sections[0].to], [1, 15]);
  assert.equal(anchored.sections[0].text, '# A plan\n\n## Phases\n\n### Phase 1 — first\n- task\n\n### Phase 2 — second\n- task\n\n### Phase 3 — third\n- task\n\n## Execution log\n<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->');
  assert.equal(anchored.sections[1].text, '### Phase 2 — ⏸ blocked on an open same-unit defect 2026-09-02\n\n**Plan committed at:** bbb2222\n\n**Blocked by:** B-900 (bug, Open) — the defect that paused it\n');
  assert.equal(anchored.sections[3].text, '## Appendix — the table the phases cite\n\n### Phase 9 — a heading that looks like an entry\n\nappendix body');

  // An appendix directly under the log heading: line `L+1` is outside the log span, and the appendix
  // owns it. That was already true under the old `Math.min` clamp and is unchanged here.
  const abutting = contextOf(['# A plan', '', '### Phase 1 — only', '- task', '', '## Execution log', '## Appendix', 'body', ''].join('\n')).context;
  assert.deepEqual(abutting.sections.map((section) => section.kind), ['plan', 'appendix']);
  assert.equal(abutting.sections[0].text, ANCHORLESS_PLAN_TEXT);
  assert.equal(abutting.sections[1].text, '## Appendix\nbody');
});

test('--context delivers no line twice and loses none, anchored or not', () => {
  const texts = [
    CONTEXT_PLAN,
    anchorless('### Phase 1 — completed 2026-09-01', '', '**What got built:** SENTINEL-BODY'),
    anchorless('### Phase 1 — ⏸ awaiting manual verification 2026-09-01'),
  ];
  for (const text of texts) {
    const { context } = contextOf(text);
    const lines = text.split('\n');
    for (const section of context.sections) {
      assert.equal(section.text, lines.slice(section.from - 1, section.to).join('\n'), 'each range labels the text it returns');
    }
    for (let index = 1; index < context.sections.length; index += 1) {
      assert.ok(context.sections[index].from > context.sections[index - 1].to, `section ${index} overlaps the one before it`);
    }
  }
});

test('next-phase --context takes the plan path in every shape build resolves one', async () => {
  // `/esq:build` preflight step 1 either uses the path the user gave or resolves the most recently
  // modified plan itself, so the routing prescribes `<plan-path>` rather than the invocation's `$0`.
  // Three shapes reach the CLI from that step; all three are argv entries, never shell words.
  const run = (file, args, options = {}) => promisify(execFile)(file, args, { timeout: 10_000, ...options });
  const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-cli-paths-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });

  const shapes = [
    ['docs/plans/work.md', 'relative, as preflight resolves one with no argument'],
    ['docs/plans/a plan with spaces.md', 'a path carrying spaces'],
    [path.join(root, 'docs/plans/work.md'), 'absolute, as a user-supplied argument'],
  ];
  for (const [target] of shapes) {
    await writeFile(path.isAbsolute(target) ? target : path.join(root, target), CONTEXT_PLAN);
  }
  for (const [target, why] of shapes) {
    const result = JSON.parse((await run(bin, ['next-phase', target, '--context'], { cwd: root })).stdout);
    assert.equal(result.file, target, why);
    assert.equal(result.state, 'paused');
    assert.equal(result.context.sections[1].text, '### Phase 2 — ⏸ blocked on an open same-unit defect 2026-09-02\n\n**Plan committed at:** bbb2222\n\n**Blocked by:** B-900 (bug, Open) — the defect that paused it\n', why);
  }
});

test('next-phase --context is additive, decodes to the source text, and refuses what the parser refuses', async () => {
  const run = (file, args, options = {}) => promisify(execFile)(file, args, { timeout: 10_000, ...options });
  const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-cli-context-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  const plan = path.join(root, 'docs/plans/work.md');
  await writeFile(plan, CONTEXT_PLAN);

  const bare = JSON.parse((await run(bin, ['next-phase', plan], { cwd: root })).stdout);
  const withContext = JSON.parse((await run(bin, ['next-phase', plan, '--context'], { cwd: root })).stdout);

  // The unflagged response is untouched, and the flagged one is that object with `context` beside it.
  const { context, ...rest } = withContext;
  assert.deepEqual(rest, bare);
  assert.equal(Object.hasOwn(bare, 'context'), false);
  assert.equal(bare.state, 'paused');

  // JSON decoding preserves the selected source text byte for byte.
  assert.equal(context.sections[1].text, '### Phase 2 — ⏸ blocked on an open same-unit defect 2026-09-02\n\n**Plan committed at:** bbb2222\n\n**Blocked by:** B-900 (bug, Open) — the defect that paused it\n');
  assert.equal(context.sections[3].text, '## Appendix — the table the phases cite\n\n### Phase 9 — a heading that looks like an entry\n\nappendix body');

  await assert.rejects(run(bin, ['next-phase', plan, '--ctx'], { cwd: root }), /usage: esq next-phase <plan> \[--context\]/);

  // Ambiguous and unsupported plans are refused identically with the flag and without it — nothing
  // declares completion in their place.
  const cases = [
    [CONTEXT_PLAN.replace('### Phase 2 — ⏸ blocked on an open same-unit defect 2026-09-02', '### Phase 1 — completed 2026-09-02'), /duplicate execution-log entry for Phase 1/],
    [CONTEXT_PLAN.replace('### Phase 3 — third', '### Phase 4 — third').replace('### Phase 3 — completed 2026-09-03', '### Phase 8 — completed 2026-09-03'), /execution log references unknown Phase 8/],
    [['# A plan', '', '## Execution log', ''].join('\n'), /plan contains no phases/],
  ];
  for (const [text, expected] of cases) {
    await writeFile(plan, text);
    await assert.rejects(run(bin, ['next-phase', plan], { cwd: root }), expected);
    await assert.rejects(run(bin, ['next-phase', plan, '--context'], { cwd: root }), expected);
  }
});

test('reserve-id obeys the worktree block and refuses exhaustion', async () => {
  const root = await fixture();
  await writeFile(path.join(root, '.esq-id-block'), 'id-block: 1000-1001\n');
  assert.equal((await reserveId(root, path.join(root, 'docs/BACKLOG.md'))).id, 'B-1000');
  const file = path.join(root, 'docs/BACKLOG.md');
  let text = await readFile(file, 'utf8');
  text += '| B-1000 | x | todo | | x | manual | | | Open |\n| B-1001 | x | todo | | y | manual | | | Open |\n';
  await writeFile(file, text);
  await assert.rejects(reserveId(root, file), /exhausted/);
});

test('set-status changes exactly one row and rejects unknown IDs', async () => {
  const root = await fixture();
  const file = path.join(root, 'docs/BACKLOG.md');
  const result = await setStatus(file, 'B-1', 'Done');
  assert.equal(result.previous, 'Open');
  assert.match(await readFile(path.join(root, 'docs/BACKLOG.md'), 'utf8'), /B-001.*Done/);
  await assert.rejects(setStatus(file, 'B-999', 'Done'), /not found/);
});

test('append-log is atomic and refuses duplicate phase entries', async () => {
  const root = await fixture();
  const plan = 'docs/plans/work.md';
  const file = path.join(root, plan);
  await appendLog(file, JSON.stringify({ phase: 1, status: 'completed', commits: ['abc1234'], whatBuilt: 'a thing', verification: ['ok'] }));
  assert.match(await readFile(file, 'utf8'), /\*\*Commits:\*\* abc1234/);
  await assert.rejects(appendLog(file, JSON.stringify({ phase: 1, status: 'completed', commits: ['abc1234'], whatBuilt: 'again', verification: ['ok'] })), /already has/);
});

const LANES = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/lanes');

test('append-log records verification provenance, and refuses a ref that can move', async () => {
  const root = await fixture();
  const file = path.join(root, 'docs/plans/work.md');
  const at = 'a'.repeat(40);
  await appendLog(file, JSON.stringify({
    phase: 1, status: 'completed', commits: ['abc1234'], whatBuilt: 'a thing',
    verification: ['(auto) node --test tests/one.test.mjs — 12 pass'],
    verified: { at, commands: ['node --test tests/one.test.mjs', 'grep -rn "todo" src/'] },
  }));
  const text = await readFile(file, 'utf8');
  assert.match(text, new RegExp(`\\*\\*Verified:\\*\\* ${at}`));
  // Rendered, then parsed back out: the block is provenance a later run reads, not decoration.
  const parsed = parseVerified(text).get(1)[0];
  assert.equal(parsed.at, at);
  assert.deepEqual(parsed.commands, ['node --test tests/one.test.mjs', 'grep -rn "todo" src/']);
  // A name that can move is not provenance — refused before the file is opened.
  for (const bad of [{ at: 'main', commands: ['x'] }, { at: 'HEAD', commands: ['x'] }, { at: at.slice(0, 7), commands: ['x'] },
    { at, commands: [] }, { at, commands: ['has `backtick`'] }, { at, commands: ['x'], extra: 1 }]) {
    await assert.rejects(appendLog(file, JSON.stringify({ phase: 2, status: 'completed', commits: ['abc1234'], whatBuilt: 'a thing', verification: ['ok'], verified: bad })), /verified/);
  }
  // An entry that omits it stays legal — every plan built before this key existed omits it.
  await appendLog(file, JSON.stringify({ phase: 2, status: 'completed', commits: ['abc1234'], whatBuilt: 'a thing', verification: ['ok'] }));
  assert.equal(parseVerified(await readFile(file, 'utf8')).has(2), false);
});

// ── The declaration log ──────────────────────────────────────────────────────
// `esq lane` is the one read with a write side effect: it appends the plan identity a session is
// working on, which is what lets `scripts/outcome-join.mjs` attribute a cost to a plan by identity
// rather than by clock (B-121). Everything below asserts the write is exactly one bounded line, that
// every path that must stay silent does, and — the assertion the whole design's safety rests on —
// that no byte lands outside the throwaway attribution directory.

const PLAN_TEXT = `# Widget\n\n## Assurance\n**Lane:** \`direct\` · **Requirements uncertainty:** low · **Implementation risk:** low\n\n- *Uncertainty — low:* settled.\n- *Risk — low:* inside the touched package.\n\n## Phases\n\n### Phase 1 — one\n\n## Execution log\n`;
const BROKEN_TEXT = `# Broken\n\n## Assurance\n**Lane:** \`full\` · **Requirements uncertainty:** high · **Implementation risk:** high\n\n- *Uncertainty — high:* named.\n\n## Phases\n\n### Phase 1 — one\n\n## Execution log\n`;

// A plan, the corrective brief beside it and an unparseable plan, under a directory carrying a `.git`
// so `repoKey` resolves — a bare directory is all the derivation stats for, so no git subprocess and
// no repository is created. `config` is where the declaration log must land, and the ONLY place any
// byte may land.
async function declarationFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-declare-'));
  await mkdir(path.join(root, 'repo/.git'), { recursive: true });
  await mkdir(path.join(root, 'repo/docs/plans'), { recursive: true });
  const plans = path.join(root, 'repo/docs/plans');
  await writeFile(path.join(plans, '2026-09-06-widget.md'), PLAN_TEXT);
  await writeFile(path.join(plans, '2026-09-06-widget-fixes.brief.md'), '# Fixes\n\n## 🟢 Fix now\n\n- one\n');
  // The second corrective round over the same plan: `/esq:review` and `/esq:converge` both append a
  // `-2` when a brief already sits beside the plan. It corrects the plan, not the plan someone may
  // later write *from* the first brief — which is what `2026-09-06-widget-fixes.md` is here.
  await writeFile(path.join(plans, '2026-09-06-widget-fixes-2.brief.md'), '# Fixes\n\n## 🟢 Fix now\n\n- two\n');
  await writeFile(path.join(plans, '2026-09-06-widget-fixes.md'), PLAN_TEXT.replace('# Widget', '# Widget fixes'));
  await writeFile(path.join(plans, '2026-09-06-widget-fixes-fixes.brief.md'), '# Fixes\n\n## 🟢 Fix now\n\n- three\n');
  // Grill output: a brief that corrects nothing, sharing the plan's slug. `lane` must refuse it
  // rather than resolve it to the plan beside it.
  await writeFile(path.join(plans, '2026-09-06-widget.brief.md'), '# Grill\n\n- a question\n');
  await writeFile(path.join(plans, '2026-09-06-broken.md'), BROKEN_TEXT);
  const config = await mkdtemp(path.join(os.tmpdir(), 'esq-declare-config-'));
  const environment = { CLAUDE_CONFIG_DIR: config, CLAUDE_CODE_SESSION_ID: 'session-under-test' };
  return {
    root,
    config,
    environment,
    plan: path.join(plans, '2026-09-06-widget.md'),
    brief: path.join(plans, '2026-09-06-widget-fixes.brief.md'),
    secondRound: path.join(plans, '2026-09-06-widget-fixes-2.brief.md'),
    derivedPlan: path.join(plans, '2026-09-06-widget-fixes.md'),
    derivedBrief: path.join(plans, '2026-09-06-widget-fixes-fixes.brief.md'),
    grill: path.join(plans, '2026-09-06-widget.brief.md'),
    broken: path.join(plans, '2026-09-06-broken.md'),
  };
}

// Every file under a directory, relative to it — the containment assertion reads the whole tree
// rather than the one path it expects, so a write that escapes is visible instead of unlooked-for.
async function tree(root) {
  const found = [];
  for (const entry of await readdir(root, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) found.push(path.relative(root, path.join(entry.parentPath ?? entry.path, entry.name)));
  }
  return found.sort();
}

async function events(file) {
  return (await readFile(file, 'utf8')).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

// The identity a review hand-off routes on: a brief's `Source:` beside its filename, and two plans
// that normalize to one slug. Its own fixture rather than `declarationFixture`'s — those briefs
// deliberately carry no `Source:` line at all, which is the fallback path this must not disturb.
async function identityFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-identity-'));
  await mkdir(path.join(root, 'repo/.git'), { recursive: true });
  await mkdir(path.join(root, 'repo/docs/plans'), { recursive: true });
  const plans = path.join(root, 'repo/docs/plans');
  await writeFile(path.join(plans, '2026-09-14-alpha.md'), PLAN_TEXT);
  await writeFile(path.join(plans, '2026-09-14-beta.md'), PLAN_TEXT);
  const config = await mkdtemp(path.join(os.tmpdir(), 'esq-identity-config-'));
  const brief = (name, source) => {
    const file = path.join(plans, name);
    return writeFile(file, `# Fixes brief\n\n${source === null ? '' : `Source: ${source}\n`}Reviewed at: abc1234\n\n## 🟢 Fix now\n\n- one\n`).then(() => file);
  };
  return { root, plans, brief, environment: { CLAUDE_CONFIG_DIR: config, CLAUDE_CODE_SESSION_ID: 'identity-session' } };
}

test('brief plan refuses a brief whose Source names another plan, and one whose slug two plans answer for', async () => {
  const fx = await identityFixture();

  // (1) The disagreement. The brief is named for `alpha` and its `Source:` says `beta`, and both
  // plans exist — so the old lookup answered `alpha` with nothing to show anything was wrong, and
  // /esq:fix would have sent the user to review a plan the brief never identified.
  const disagreeing = await fx.brief('2026-09-14-alpha-fixes-2.brief.md', '/esq:review on beta, 2026-09-14');
  await assert.rejects(
    briefPlan(disagreeing),
    /its `Source:` names `beta` but its filename says `alpha`/,
    'a brief whose Source names another plan must refuse, naming both and choosing neither',
  );

  // (2) The ambiguity. Two plans normalize to `alpha` — the date prefix is not part of a slug — and
  // the old `.find` returned whichever sorted first, which is the September 13 file.
  await writeFile(path.join(fx.plans, '2026-09-13-alpha.md'), PLAN_TEXT);
  const agreeing = await fx.brief('2026-09-14-alpha-fixes.brief.md', '/esq:review on alpha, 2026-09-14');
  await assert.rejects(
    briefPlan(agreeing),
    /2 plans beside this brief carry the slug `alpha` it corrects — 2026-09-13-alpha\.md, 2026-09-14-alpha\.md/,
    'an ambiguous slug must refuse naming every candidate, never resolve by sort order',
  );
});

test('brief plan resolves an ordinary brief — an agreeing Source, a check Source, a date-prefixed Source, and no Source at all', async () => {
  const fx = await identityFixture();
  const alpha = path.join(fx.plans, '2026-09-14-alpha.md');

  // The valid review case the hand-off actually routes on, uniquifier included: a second corrective
  // round whose `Source:` agrees resolves to the one plan, and keeps the brief on the result.
  const second = await fx.brief('2026-09-14-alpha-fixes-2.brief.md', '/esq:review on alpha, 2026-09-14');
  assert.deepEqual(await briefPlan(second), { brief: second, plan: alpha, range: null, finder: 'review' });

  // A check-originated brief is validated the same way and keeps its own route — the parser accepts
  // both commands, and this route is not the review hand-off's to change.
  // The finder is answered too, because it is what /esq:converge routes on: entering from a `check`
  // brief runs a fix and no review, so that run may not record review coverage.
  const fromCheck = await fx.brief('2026-09-14-alpha-fixes-3.brief.md', '/esq:check on alpha, 2026-09-14');
  assert.deepEqual(await briefPlan(fromCheck), { brief: fromCheck, plan: alpha, range: null, finder: 'check' });

  // A `Source:` carrying the plan's date prefix agrees: `normalizeSlug` strips it on both sides,
  // which is what several checked-in briefs in this repo actually look like.
  const dated = await fx.brief('2026-09-14-alpha-fixes-4.brief.md', '/esq:review on 2026-09-13-alpha, 2026-09-14');
  assert.equal((await briefPlan(dated)).plan, alpha);

  // No `Source:` line — every brief written before that header existed — resolves by filename
  // exactly as it always did. The validation adds a refusal; it never adds a requirement.
  const bare = await fx.brief('2026-09-14-alpha-fixes-5.brief.md', null);
  assert.deepEqual(await briefPlan(bare), { brief: bare, plan: alpha, range: null, finder: null });
});

test('brief plan answers a commit-range brief without a plan, and that is the only thing that makes one plan-less', async () => {
  const fx = await identityFixture();

  // A /esq:review invoked on a commit range writes this: there is no plan file to correct, and the
  // Source says so. The range comes back in full so a later HEAD, or the fix's own closing commit,
  // cannot silently replace the change under review.
  const ranged = await fx.brief(
    '2026-09-14-9f8e7d6-fixes.brief.md',
    '/esq:review on 4d1a0b9c8e7f6a5b4c3d2e1f00998877..66554433221100ffeeddccbbaa998877, 2026-09-14',
  );
  assert.deepEqual(await briefPlan(ranged), {
    brief: ranged, plan: null, range: '4d1a0b9c8e7f6a5b4c3d2e1f00998877..66554433221100ffeeddccbbaa998877', finder: 'review',
  }, 'a two-dot commit range resolves to no plan and keeps its own identity');

  // A slug can never contain `..`, so the two shapes are not confusable — and the discriminator is
  // the producer's own declaration, never a guess about what happens to be on disk.
  // EVERY refusal below is unchanged: a brief that CLAIMS a plan still has to resolve to one.
  const ghost = await fx.brief('2026-09-14-ghost-fixes.brief.md', '/esq:review on ghost, 2026-09-14');
  await assert.rejects(briefPlan(ghost), /no plan beside this brief carries the slug `ghost`/,
    'a missing plan is still an error, never a silent reclassification as plan-less');

  // And a brief whose Source cannot be read at all is NOT plan-less either: it resolves by filename
  // exactly as it always did, which is every brief written before the header existed.
  const bare = await fx.brief('2026-09-14-beta-fixes.brief.md', null);
  assert.equal((await briefPlan(bare)).plan, path.join(fx.plans, '2026-09-14-beta.md'));
});

test('brief plan refuses a brief it cannot read, and stays silent only when the brief is absent', async () => {
  const fx = await identityFixture();

  // A brief that is *there* and unreadable carries a `Source:` this code could not check. Swallowing
  // that read would resolve by filename alone — the pre-validation behavior, restored silently, on
  // exactly the call the hand-off routes on. A directory at the brief's path is the root-safe way to
  // make the read fail as something other than ENOENT (EISDIR); a chmod would not fail under root.
  await mkdir(path.join(fx.plans, '2026-09-14-alpha-fixes.brief.md'));
  await assert.rejects(
    briefPlan(path.join(fx.plans, '2026-09-14-alpha-fixes.brief.md')),
    (error) => error.code === 'EISDIR',
    'an unreadable brief must not fall through to filename-only resolution',
  );

  // An absent brief was never opened before this validation existed either, so it keeps reporting
  // the slug miss rather than a read error — the fallback narrows to ENOENT and nothing wider.
  await assert.rejects(
    briefPlan(path.join(fx.plans, '2026-09-14-orphan-fixes.brief.md')),
    /no plan beside this brief carries the slug `orphan`/,
  );
});

// The stats fixture tree: ten plans, three corrective briefs, one grill brief, one backlog. Its
// history is served through the git seam, because a fixture directory has no commits of its own.
const STATS_ROOT = path.join(LANES, 'stats');
// `git log` prints newest first, and the seam serves the command's own `%h %ad %s` shape. The four
// shapes the reopen rate has to tell apart all live here: a lean lane over its one-finder budget
// (alpha), a lean lane inside it (beta), a `full` plan running its two-finder itinerary exactly
// (theta) and one running a pass beyond it (kappa) — plus eta, whose budget must come from the lane
// it escalated to rather than the one it recorded. theta's and kappa's loops run on days their plans
// do not log a phase, so a `closedAt` read from this history is distinguishable from one read off
// the execution log.
const STATS_LOG = [
  'aaaaab4 2026-08-12 brief(fixes): kappa',
  'aaaaab3 2026-08-11 brief(fixes): clear kappa, all fixes applied',
  'aaaaab2 2026-08-11 brief(fixes): kappa',
  'aaaaab1 2026-08-10 brief(fixes): kappa',
  'aaaaaa9 2026-08-10 brief(fixes): theta',
  'aaaaaa8 2026-08-09 brief(fixes): clear theta, all fixes applied',
  'aaaaaa7 2026-08-09 brief(fixes): theta',
  'aaaaaa6 2026-08-07 brief(fixes): eta',
  'aaaaaa5 2026-08-07 brief(fixes): clear eta, all fixes applied',
  'aaaaaa4 2026-08-07 brief(fixes): eta',
  'aaaaaa3 2026-08-05 brief(fixes): alpha',
  'aaaaaa2 2026-08-02 brief(fixes): clear alpha, all fixes applied',
  'aaaaaa1 2026-08-02 brief(fixes): beta',
  'aaaaaa0 2026-08-01 brief(fixes): alpha',
].join('\n');

async function statsFixture() {
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = STATS_ROOT;
  process.env.ESQ_TEST_GIT_LOG = STATS_LOG;
  return laneStats(STATS_ROOT);
}

test('validate catches invalid table state', async () => {
  const root = await fixture();
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  assert.equal((await validate(root)).valid, true);
  const file = path.join(root, 'docs/BACKLOG.md');
  const text = (await readFile(file, 'utf8')).replace('| Open |', '| Resolved |');
  await writeFile(file, text);
  const result = await validate(root);
  assert.equal(result.valid, false);
  assert.match(result.findings.join('\n'), /invalid backlog status/);
});

// Every row kind the live file has shown (2026-08-19), field names copied from the handler's output:
// typed SubagentStop rows with whole-run usage (one with two models), the harness's recap/title rows
// (agentType "" + runUsage null), a PostToolUse fallback with resolvedModel and no modelsUsed, a row
// predating the `source` field, a malformed line, one agentId recorded by both handlers (fallback then
// whole-run row — the superseded shape the writer leaves on purpose), a second fallback row for the
// Explore run (a pre-claim repeat of the same quality — a genuine duplicate), a whole-run row whose usage
// sums to zero (a measurement failure, never a sample), and labels — one carrying the `requestedModel`
// the orchestrator passed (B-042), two for one agentId (a backgrounded spawn fires PostToolUse twice —
// the repeat carries a model the first did not, and the first wins) and one for an agentId never recorded.
// Two repository keys, in `repoKey`'s own shape (32 lowercase hex): every scoped row below is `KEY_A`,
// which is the fixture's "this repository". `KEY_B` exists so a foreign key is a value the reader can
// see rather than an absence.
const KEY_A = 'a'.repeat(32);
const KEY_B = 'b'.repeat(32);
const TELEMETRY_ROWS = [
  { recordedAt: '2026-08-19T05:17:50.791Z', source: 'SubagentStop', sessionId: 's1', agentId: 'a-build-1', agentType: 'general-purpose', models: ['claude-opus-5'], durationMs: 2948, toolUseCount: 1, apiRequests: 2, runUsage: { input_tokens: 4, output_tokens: 72, cache_creation_input_tokens: 18155, cache_read_input_tokens: 14776 }, transcriptComplete: true, repoKey: KEY_A },
  { recordedAt: '2026-08-19T05:21:22.785Z', source: 'SubagentStop', sessionId: 's1', agentId: 'a-build-2', agentType: 'general-purpose', models: ['claude-opus-5'], durationMs: 116890, toolUseCount: 23, apiRequests: 18, runUsage: { input_tokens: 36, output_tokens: 7975, cache_creation_input_tokens: 58504, cache_read_input_tokens: 919626 }, transcriptComplete: true },
  { recordedAt: '2026-08-19T06:00:00.000Z', source: 'SubagentStop', sessionId: 's2', agentId: 'a-mixed', agentType: 'general-purpose', models: ['claude-opus-5', 'claude-haiku-4-5-20251001'], durationMs: 5000, toolUseCount: 2, apiRequests: 3, runUsage: { input_tokens: 10, output_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, transcriptComplete: true },
  { recordedAt: '2026-08-19T02:42:50.713Z', source: 'SubagentStop', sessionId: 's3', agentId: 'a-noise', agentType: '', models: [], durationMs: null, toolUseCount: null, apiRequests: null, runUsage: null, transcriptComplete: false },
  { recordedAt: '2026-08-19T05:21:45.017Z', source: 'PostToolUse', sessionId: 's4', agentId: 'a-explore', agentType: 'Explore', resolvedModel: 'claude-sonnet-5', durationMs: 59498, toolUseCount: 9, finalRequestTokens: 31938, finalRequestUsage: { input_tokens: 2, cache_creation_input_tokens: 846, cache_read_input_tokens: 29264, output_tokens: 1826 } },
  { recordedAt: '2026-08-18T06:38:50.873Z', sessionId: 's5', agentId: 'a-legacy', agentType: 'general-purpose', resolvedModel: 'claude-opus-5[1m]', durationMs: 4747, toolUseCount: 1, finalRequestTokens: 14443, finalRequestUsage: { input_tokens: 2, cache_creation_input_tokens: 100, cache_read_input_tokens: 14000, output_tokens: 341 } },
  '{"recordedAt":"2026-08-19T07:00:00.000Z","source":"SubagentStop",',
  { recordedAt: '2026-08-18T18:30:36.170Z', source: 'PostToolUse', sessionId: 's6', agentId: 'a-dup', agentType: 'general-purpose', resolvedModel: 'claude-haiku-4-5-20251001', durationMs: 1013, toolUseCount: 0, finalRequestTokens: 7948, finalRequestUsage: { input_tokens: 2, cache_creation_input_tokens: 0, cache_read_input_tokens: 7900, output_tokens: 46 } },
  { recordedAt: '2026-08-18T18:30:36.473Z', source: 'SubagentStop', sessionId: 's6', agentId: 'a-dup', agentType: 'general-purpose', models: ['claude-haiku-4-5-20251001'], durationMs: 984, toolUseCount: 0, apiRequests: 1, runUsage: { input_tokens: 10, output_tokens: 20, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, transcriptComplete: true },
  { recordedAt: '2026-08-19T05:21:45.300Z', source: 'PostToolUse', sessionId: 's4', agentId: 'a-explore', agentType: 'Explore', resolvedModel: 'claude-sonnet-5', durationMs: 59498, toolUseCount: 9, finalRequestTokens: 31938, finalRequestUsage: { input_tokens: 2, cache_creation_input_tokens: 846, cache_read_input_tokens: 29264, output_tokens: 1826 } },
  { recordedAt: '2026-08-19T06:30:00.000Z', source: 'SubagentStop', sessionId: 's8', agentId: 'a-zero', agentType: 'general-purpose', models: ['claude-opus-5'], durationMs: 3000, toolUseCount: 0, apiRequests: 1, runUsage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, transcriptComplete: true },
  { recordedAt: '2026-08-19T05:17:40.000Z', source: 'AgentLabel', sessionId: 's1', agentId: 'a-build-1', agentType: 'general-purpose', esqCommand: 'build', requestedModel: 'opus', planSlug: 'plan-one', repoKey: KEY_A },
  { recordedAt: '2026-08-19T05:19:00.000Z', source: 'AgentLabel', sessionId: 's1', agentId: 'a-build-2', agentType: 'general-purpose', esqCommand: 'build', planSlug: 'plan-two', repoKey: KEY_A },
  { recordedAt: '2026-08-19T05:19:00.500Z', source: 'AgentLabel', sessionId: 's1', agentId: 'a-build-2', agentType: 'general-purpose', esqCommand: 'build', requestedModel: 'sonnet', planSlug: 'plan-three', repoKey: KEY_B },
  { recordedAt: '2026-08-19T08:00:00.000Z', source: 'AgentLabel', sessionId: 's7', agentId: 'a-orphan', agentType: 'general-purpose', esqCommand: 'check' },
];

async function telemetryFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-telemetry-'));
  const file = path.join(root, 'agent-runs.jsonl');
  await writeFile(file, `${TELEMETRY_ROWS.map((row) => (typeof row === 'string' ? row : JSON.stringify(row))).join('\n')}\n`);
  return { root, file };
}

test('summarizeTelemetry joins labels onto runs and aggregates per command, agent type and model', async () => {
  const { file } = await telemetryFixture();
  const summary = await summarizeTelemetry([file]);
  assert.deepEqual(summary.files, [{ file, rows: 15 }]);
  assert.deepEqual(summary.window, { first: '2026-08-18T06:38:50.873Z', last: '2026-08-19T08:00:00.000Z' });
  // Seven runs: three typed SubagentStop rows, the PostToolUse fallback, the legacy row, the superseded
  // pair and the zero-usage run. The pair's fallback row is superseded by its whole-run row — the writer's
  // rule read back — while the Explore repeat is a duplicate of the same quality.
  assert.equal(summary.runs, 7);
  assert.deepEqual(summary.skipped, { historicalNoise: 1, malformed: 1, duplicates: 1, supersededFallbacks: 1, excluded: 0 });
  // Token-less runs, by reason: the PostToolUse and legacy rows are fallback-only, the zero-sum run is
  // zero usage; the noise row is not a run, so it is not a `noUsage` run either.
  assert.deepEqual(summary.withoutUsage, { total: 3, fallbackOnly: 2, noUsage: 0, zeroUsage: 1 });
  assert.deepEqual(summary.labelledWithoutRecord, { total: 1, byCommand: { 'esq:check': 1 } });
  // by command: the two labelled builds (a repeated label counts once), everything else unlabelled.
  assert.deepEqual(Object.keys(summary.byCommand), ['esq:build', 'unlabelled']);
  const build = summary.byCommand['esq:build'];
  assert.equal(build.runs, 2);
  assert.deepEqual(build.tokens, { runs: 2, input: 40, output: 8047, cacheCreation: 76659, cacheRead: 934402, total: 1019148, medianOutput: 4023.5 });
  assert.deepEqual(build.toolCalls, { runs: 2, total: 24, median: 12 });
  // Round trips are a fourth axis on the same runs; `calls/trip` is summed over the paired population,
  // never a mean of per-run ratios (D-calls-per-turn-over-a-paired-population): 24 calls ÷ 20 trips.
  assert.deepEqual(build.apiRequests, { runs: 2, total: 20, median: 10 });
  assert.deepEqual(build.paired, { runs: 2, toolCalls: 24, apiRequests: 20 });
  assert.equal(build.callsPerTrip, 1.2);
  assert.deepEqual(build.durationMs, { runs: 2, total: 119838, median: 59919 });
  const unlabelled = summary.byCommand.unlabelled;
  assert.equal(unlabelled.runs, 5);
  // Fallback rows (PostToolUse, legacy) and the zero-usage run contribute duration and tool calls but never tokens.
  assert.equal(unlabelled.tokens.runs, 2);
  assert.ok(unlabelled.tokens.runs < unlabelled.runs);
  assert.equal(unlabelled.tokens.output, 120);
  assert.equal(unlabelled.durationMs.runs, 5);
  assert.equal(unlabelled.durationMs.median, 4747);
  assert.equal(unlabelled.toolCalls.median, 1);
  // The two fallback rows carry `toolUseCount` and no `apiRequests`: they count as runs and as tool
  // calls, and enter neither the trips median nor the ratio's population — 2 calls over 5 trips, not 12.
  assert.equal(unlabelled.apiRequests.runs, 3);
  assert.equal(unlabelled.apiRequests.median, 1);
  assert.deepEqual(unlabelled.paired, { runs: 3, toolCalls: 2, apiRequests: 5 });
  assert.equal(unlabelled.callsPerTrip, 0.4);
  // by agent type
  assert.deepEqual(Object.keys(summary.byAgentType), ['Explore', 'general-purpose']);
  assert.equal(summary.byAgentType.Explore.runs, 1);
  assert.equal(summary.byAgentType.Explore.tokens.runs, 0);
  assert.equal(summary.byAgentType.Explore.tokens.medianOutput, null);
  // A group whose only run predates `apiRequests` invents neither a trip count nor a ratio.
  assert.deepEqual(summary.byAgentType.Explore.apiRequests, { runs: 0, total: 0, median: null });
  assert.deepEqual(summary.byAgentType.Explore.paired, { runs: 0, toolCalls: 0, apiRequests: 0 });
  assert.equal(summary.byAgentType.Explore.callsPerTrip, null);
  assert.equal(summary.byAgentType['general-purpose'].runs, 6);
  // by model: SubagentStop rows key on models[] (sorted, joined with +), fallback rows on resolvedModel.
  assert.deepEqual(Object.keys(summary.byModel), ['claude-haiku-4-5-20251001', 'claude-haiku-4-5-20251001+claude-opus-5', 'claude-opus-5', 'claude-opus-5[1m]', 'claude-sonnet-5']);
  // The zero-usage opus run counts as a run and in the duration median, but is no token sample: the
  // output median is the two real runs' (72, 7975), never pulled down by a zero.
  assert.equal(summary.byModel['claude-opus-5'].runs, 3);
  assert.equal(summary.byModel['claude-opus-5'].tokens.runs, 2);
  assert.equal(summary.byModel['claude-opus-5'].tokens.medianOutput, 4023.5);
  assert.equal(summary.byModel['claude-opus-5'].tokens.total, 1019148);
  assert.equal(summary.byModel['claude-opus-5'].durationMs.runs, 3);
  assert.equal(summary.byModel['claude-opus-5'].durationMs.median, 3000);
  assert.equal(summary.byModel['claude-haiku-4-5-20251001+claude-opus-5'].tokens.output, 100);
  // The deduplicated pair kept the SubagentStop row: haiku carries that run's usage, not its final request.
  assert.deepEqual(summary.byModel['claude-haiku-4-5-20251001'].tokens, { runs: 1, input: 10, output: 20, cacheCreation: 0, cacheRead: 0, total: 30, medianOutput: 20 });
  assert.equal(summary.byModel['claude-sonnet-5'].tokens.runs, 0);
  assert.equal(summary.byModel['claude-sonnet-5'].durationMs.median, 59498);
  // The Explore repeat is skipped as a duplicate: one run, one duration, one tool count.
  assert.equal(summary.byAgentType.Explore.durationMs.runs, 1);
  assert.equal(summary.byAgentType.Explore.toolCalls.total, 9);
  // by command × model: the same runs keyed by both, with what the orchestrator asked for (B-042).
  // a-build-1 asked `opus` and ran opus (honored); a-build-2's first label carries no model (the
  // repeat's `sonnet` is ignored — first wins), so the group is asked-for under one spelling and its
  // verdict is honored; the unlabelled runs split by model with `requested: null`.
  assert.deepEqual(Object.keys(summary.byCommandModel), ['esq:build · claude-opus-5', 'unlabelled · claude-haiku-4-5-20251001', 'unlabelled · claude-haiku-4-5-20251001+claude-opus-5', 'unlabelled · claude-opus-5', 'unlabelled · claude-opus-5[1m]', 'unlabelled · claude-sonnet-5']);
  const buildOpus = summary.byCommandModel['esq:build · claude-opus-5'];
  assert.equal(buildOpus.runs, 2);
  assert.deepEqual(buildOpus.tokens, build.tokens);
  assert.equal(buildOpus.provisional, true);
  assert.equal(buildOpus.requested, 'opus');
  assert.equal(buildOpus.verdict, 'honored');
  assert.deepEqual(summary.byCommandModel['unlabelled · claude-sonnet-5'].durationMs, summary.byModel['claude-sonnet-5'].durationMs);
  assert.equal(summary.byCommandModel['unlabelled · claude-sonnet-5'].requested, null);
  assert.equal(summary.byCommandModel['unlabelled · claude-sonnet-5'].verdict, 'unrequested');
  assert.equal(summary.byCommandModel['unlabelled · claude-opus-5'].runs, 1, 'the zero-usage run is the only unlabelled opus run');
  assert.deepEqual(summary.spawnModel, { requested: 1, honored: 1, mismatch: 0, unrequested: 1 });
  assert.ok(summary.notes.includes(INTERRUPTED_RUNS_NOTE));
  assert.ok(summary.notes.some((note) => /1 row predates? the `source` field, read as PostToolUse/.test(note)));
});

// A provisional fixture: `esq:thin` has 4 token-bearing runs plus one fallback-only run (5 runs, 4 w/
// tokens); `esq:full` has exactly 5 token-bearing runs. Only token-bearing runs count toward the five.
const PROVISIONAL_ROWS = [];
for (let i = 0; i < 4; i += 1) {
  PROVISIONAL_ROWS.push({ recordedAt: `2026-08-19T10:0${i}:00.000Z`, source: 'SubagentStop', sessionId: 'p', agentId: `thin-${i}`, agentType: 'general-purpose', models: ['claude-opus-5'], durationMs: 1000 + i, toolUseCount: i, apiRequests: 1, runUsage: { input_tokens: 1, output_tokens: 10 + i, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, transcriptComplete: true });
  PROVISIONAL_ROWS.push({ recordedAt: `2026-08-19T10:0${i}:00.000Z`, source: 'AgentLabel', sessionId: 'p', agentId: `thin-${i}`, agentType: 'general-purpose', esqCommand: 'thin' });
}
PROVISIONAL_ROWS.push({ recordedAt: '2026-08-19T10:05:00.000Z', source: 'PostToolUse', sessionId: 'p', agentId: 'thin-fallback', agentType: 'general-purpose', resolvedModel: 'claude-opus-5', durationMs: 1500, toolUseCount: 3, finalRequestTokens: 100, finalRequestUsage: { input_tokens: 2, cache_creation_input_tokens: 0, cache_read_input_tokens: 90, output_tokens: 8 } });
PROVISIONAL_ROWS.push({ recordedAt: '2026-08-19T10:05:00.000Z', source: 'AgentLabel', sessionId: 'p', agentId: 'thin-fallback', agentType: 'general-purpose', esqCommand: 'thin' });
for (let i = 0; i < 5; i += 1) {
  PROVISIONAL_ROWS.push({ recordedAt: `2026-08-19T11:0${i}:00.000Z`, source: 'SubagentStop', sessionId: 'p', agentId: `full-${i}`, agentType: 'Explore', models: ['claude-sonnet-5'], durationMs: 2000 + i, toolUseCount: i, apiRequests: 1, runUsage: { input_tokens: 1, output_tokens: 20 + i, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, transcriptComplete: true });
  PROVISIONAL_ROWS.push({ recordedAt: `2026-08-19T11:0${i}:00.000Z`, source: 'AgentLabel', sessionId: 'p', agentId: `full-${i}`, agentType: 'Explore', esqCommand: 'full' });
}

async function provisionalFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-telemetry-provisional-'));
  const file = path.join(root, 'agent-runs.jsonl');
  await writeFile(file, `${PROVISIONAL_ROWS.map((row) => JSON.stringify(row)).join('\n')}\n`);
  return { root, file };
}

test('summarizeTelemetry marks a group provisional below five token-bearing runs; a fallback-only run does not count toward the five', async () => {
  assert.equal(MIN_SAMPLE_RUNS, 5);
  const { file } = await provisionalFixture();
  const summary = await summarizeTelemetry([file]);
  assert.equal(summary.sampleThreshold, 5);
  const thin = summary.byCommand['esq:thin'];
  assert.equal(thin.runs, 5);
  assert.equal(thin.tokens.runs, 4);
  assert.equal(thin.provisional, true, 'five runs of which four carry tokens is still provisional');
  const full = summary.byCommand['esq:full'];
  assert.equal(full.tokens.runs, 5);
  assert.equal(full.provisional, false);
  // The same rule seals every table: by agent type and by model carry the flag too.
  assert.equal(summary.byAgentType['general-purpose'].provisional, true);
  assert.equal(summary.byAgentType.Explore.provisional, false);
  assert.equal(summary.byModel['claude-opus-5'].provisional, true);
  assert.equal(summary.byModel['claude-sonnet-5'].provisional, false);
  // The main fixture: every group there is under five, so every group is provisional.
  const main = await summarizeTelemetry([(await telemetryFixture()).file]);
  for (const tableName of ['byCommand', 'byAgentType', 'byModel', 'byCommandModel']) for (const group of Object.values(main[tableName])) assert.equal(group.provisional, true);
});

// The session writer's rows (plugin/scripts/record-session-telemetry.mjs), field names copied from its
// output. Two sessions: `d1` ran /esq:status (a cumulative pair — the Stop row then the SessionEnd
// row for segment 0 — and an open /esq:grill segment 1 whose only row is a Stop); `d2` ran esq:plan
// five times through the Skill tool (at the threshold, so not provisional; one segment ran on two
// models, so the group lists both) — plus one row whose slug fails the pattern and one whose segment
// is not an integer, both dropped as noise.
function directRow(overrides) {
  return { recordedAt: '2026-08-19T12:00:00.000Z', source: 'SessionStop', sessionId: 'd1', segment: 0, esqCommand: 'status', repoKey: KEY_A, via: 'typed', startedAt: '2026-08-19T11:59:00.000Z', lastAt: '2026-08-19T11:59:30.000Z', durationMs: 30000, models: ['claude-opus-5'], apiRequests: 2, toolUseCount: 3, runUsage: { input_tokens: 1, output_tokens: 10, cache_creation_input_tokens: 100, cache_read_input_tokens: 1000 }, closedBy: null, ...overrides };
}
const SESSION_ROWS = [
  directRow({}),
  directRow({ recordedAt: '2026-08-19T12:02:00.000Z', source: 'SessionEnd', lastAt: '2026-08-19T12:01:30.000Z', durationMs: 150000, apiRequests: 5, toolUseCount: 8, runUsage: { input_tokens: 3, output_tokens: 40, cache_creation_input_tokens: 200, cache_read_input_tokens: 5000 }, closedBy: 'command' }),
  directRow({ recordedAt: '2026-08-19T12:03:00.000Z', segment: 1, esqCommand: 'grill', planAmbiguous: true, startedAt: '2026-08-19T12:01:40.000Z', lastAt: '2026-08-19T12:02:50.000Z', durationMs: 70000, models: ['claude-sonnet-5'], apiRequests: 3, toolUseCount: 1, runUsage: { input_tokens: 2, output_tokens: 30, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, closedBy: null }),
  ...[0, 1, 2, 3, 4].map((i) => directRow({ recordedAt: `2026-08-19T13:0${i}:00.000Z`, source: 'SessionEnd', sessionId: 'd2', segment: i, esqCommand: 'plan', via: 'skill-tool', planSlug: 'plan-one', durationMs: 10000 + i, models: i === 4 ? ['claude-sonnet-5', 'claude-opus-5'] : ['claude-opus-5'], apiRequests: 1, toolUseCount: i, runUsage: { input_tokens: 1, output_tokens: 100 + i, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, closedBy: 'session-end' })),
  directRow({ recordedAt: '2026-08-19T14:00:00.000Z', sessionId: 'd3', segment: 0, esqCommand: 'Status' }),
  directRow({ recordedAt: '2026-08-19T14:00:00.000Z', sessionId: 'd3', segment: '1', esqCommand: 'status' }),
];

async function sessionFixture(root) {
  const dir = root || (await mkdtemp(path.join(os.tmpdir(), 'esq-telemetry-session-')));
  const file = path.join(dir, 'session-runs.jsonl');
  await writeFile(file, `${SESSION_ROWS.map((row) => JSON.stringify(row)).join('\n')}\n`);
  return { root: dir, file };
}

test('summarizeTelemetry reads session-runs.jsonl into direct — last cumulative row per (sessionId, segment), open and superseded counts, via, the same provisional rule — and never into the subagent tables', async () => {
  const agent = await telemetryFixture();
  const session = await sessionFixture(agent.root);
  const summary = await summarizeTelemetry([agent.file, session.file]);
  assert.deepEqual(summary.files, [{ file: agent.file, rows: 15 }, { file: session.file, rows: 10 }]);
  // Subagent tables are exactly what the agent-runs file alone gives.
  const alone = await summarizeTelemetry([agent.file]);
  for (const key of ['runs', 'withoutUsage', 'skipped', 'labelledWithoutRecord', 'byCommand', 'byAgentType', 'byModel']) {
    assert.deepEqual(summary[key], key === 'skipped' ? { ...alone.skipped, historicalNoise: alone.skipped.historicalNoise + 2 } : alone[key], key);
  }
  assert.deepEqual(alone.direct, { segments: 0, sessions: 0, open: 0, superseded: 0, byCommand: {} });
  // Seven segments across two sessions: status (pair → 1 superseded), grill (open), five plan.
  assert.equal(summary.direct.segments, 7);
  assert.equal(summary.direct.sessions, 2);
  assert.equal(summary.direct.open, 1);
  assert.equal(summary.direct.superseded, 1);
  assert.deepEqual(Object.keys(summary.direct.byCommand), ['esq:grill', 'esq:plan', 'esq:status']);
  const status = summary.direct.byCommand['esq:status'];
  // The last cumulative row's sum, not the pair's: 3 + 40 + 200 + 5000.
  assert.equal(status.runs, 1);
  assert.deepEqual(status.tokens, { runs: 1, input: 3, output: 40, cacheCreation: 200, cacheRead: 5000, total: 5243, medianOutput: 40 });
  assert.deepEqual(status.toolCalls, { runs: 1, total: 8, median: 8 });
  assert.deepEqual(status.durationMs, { runs: 1, total: 150000, median: 150000 });
  assert.equal(status.provisional, true);
  assert.deepEqual(status.via, { typed: 1, 'skill-tool': 0 });
  const plan = summary.direct.byCommand['esq:plan'];
  assert.equal(plan.runs, 5);
  assert.equal(plan.tokens.runs, 5);
  assert.equal(plan.provisional, false, 'five token-bearing segments reach the threshold');
  assert.equal(plan.tokens.medianOutput, 102);
  assert.deepEqual(plan.via, { typed: 0, 'skill-tool': 5 });
  assert.deepEqual(summary.direct.byCommand['esq:grill'].via, { typed: 1, 'skill-tool': 0 });
  // The model the orchestrator's own session ran on, per group: sorted, `+`-joined when segments span two.
  assert.equal(status.models, 'claude-opus-5');
  assert.equal(summary.direct.byCommand['esq:grill'].models, 'claude-sonnet-5');
  assert.equal(plan.models, 'claude-opus-5+claude-sonnet-5');
  assert.equal(summary.sampleThreshold, MIN_SAMPLE_RUNS);
  // The direct note is always present; the opt-out note only when the CLI's own shell is opted out.
  assert.ok(summary.notes.includes(DIRECT_SEGMENTS_NOTE));
  assert.ok(!summary.notes.includes(TELEMETRY_OPT_OUT_NOTE));
  const optedOut = await summarizeTelemetry([session.file], { environment: { ESQ_TELEMETRY: '0' } });
  assert.ok(optedOut.notes.includes(TELEMETRY_OPT_OUT_NOTE));
  assert.ok(!(await summarizeTelemetry([session.file], { environment: { ESQ_TELEMETRY: '1' } })).notes.includes(TELEMETRY_OPT_OUT_NOTE));
  // The session file alone: a report with empty subagent tables and the same direct section.
  const only = await summarizeTelemetry([session.file]);
  assert.equal(only.runs, 0);
  assert.deepEqual(only.direct, summary.direct);
});

// B-051: a documented invalid sample leaves every group and the run total, whatever the shape of its
// rows — the label that named its command, the fallback and the whole-run record that supersedes it —
// and is reported once as `skipped.excluded`, never once per row. The control run is identical but for
// its agentId, so anything the assertions below see is the exclusion and not the fixture.
test('summarizeTelemetry emits runRows only under { rows: true } — one per counted run and per direct segment, on an exact key allowlist', async () => {
  const agent = await telemetryFixture();
  const session = await sessionFixture(agent.root);
  const plain = await summarizeTelemetry([agent.file, session.file]);
  assert.ok(!('runRows' in plain), 'the rows surface is off by default');
  const withRows = await summarizeTelemetry([agent.file, session.file], { rows: true });
  const { runRows, ...rest } = withRows;
  // The option adds one key at the end and changes nothing else: every existing consumer of this
  // object — `cost-budgets.mjs` among them — reads exactly what it read before. Diffed as the two
  // serialized documents, not only field by field, so a reordered key would fail here too (B-121).
  assert.deepEqual(rest, plain);
  assert.equal(JSON.stringify(rest), JSON.stringify(plain));
  assert.deepEqual(Object.keys(withRows), [...Object.keys(plain), 'runRows']);
  // One entry per run the summary counted and per direct segment it sealed — and nothing for the
  // rows neither counted: the orphan label, the malformed line, the noise rows, the duplicates.
  assert.equal(runRows.length, plain.runs + plain.direct.segments);
  assert.equal(runRows.length, 14);
  // A closed allowlist, asserted key-for-key: a field added to the store upstream cannot reach this
  // surface until someone names it here, and no sessionId, path or text ever appears.
  for (const row of runRows) assert.deepEqual(Object.keys(row), RUN_ROW_KEYS);
  assert.deepEqual(RUN_ROW_KEYS, ['recordedAt', 'command', 'models', 'source', 'tokensTotal', 'apiRequests', 'toolCalls', 'durationMs', 'repoKey', 'planSlug', 'planAmbiguous', 'agentId']);
  // Scope is on every row or it is `null` — never conditional on an identity being there, because the
  // rows a coverage rate turns on are exactly the ones with no slug (B-121).
  for (const row of runRows) assert.ok(row.repoKey === null || /^[0-9a-f]{32}$/.test(row.repoKey), JSON.stringify(row));
  // Chronological, so a temporal join walks the windows in order on every machine.
  const stamps = runRows.map((row) => row.recordedAt);
  assert.deepEqual(stamps, [...stamps].sort());
  const at = (recordedAt) => runRows.filter((row) => row.recordedAt === recordedAt);
  // A labelled subagent run carries its command, its models and its whole-run totals.
  assert.deepEqual(at('2026-08-19T05:17:50.791Z'), [{ recordedAt: '2026-08-19T05:17:50.791Z', command: 'esq:build', models: ['claude-opus-5'], source: 'SubagentStop', tokensTotal: 33007, apiRequests: 2, toolCalls: 1, durationMs: 2948, repoKey: KEY_A, planSlug: 'plan-one', planAmbiguous: false, agentId: 'a-build-1' }]);
  // A spawned run's plan marker lives on its `AgentLabel` and nowhere else, so identity reaches the row
  // through the label. `a-build-2`'s chosen whole-run record predates scoping and carries no key at
  // all: the label is the fallback, and the first label for an agentId wins, so the second one's
  // foreign key and third slug never reach the row.
  assert.deepEqual(at('2026-08-19T05:21:22.785Z')[0].repoKey, KEY_A);
  assert.equal(at('2026-08-19T05:21:22.785Z')[0].planSlug, 'plan-two');
  // A run with neither a label nor a scoped record carries `null` on both — an absence, never a guess.
  assert.deepEqual(
    at('2026-08-19T06:00:00.000Z').map((row) => [row.repoKey, row.planSlug, row.planAmbiguous]),
    [[null, null, false]],
  );
  // A run whose usage sums to zero is a measurement failure, so `tokensTotal` is null and never 0 —
  // a joiner that summed it would read a broken record as a free run (B-037).
  assert.equal(at('2026-08-19T06:30:00.000Z')[0].tokensTotal, null);
  // The legacy fallback: no label, no whole-run usage, no round-trip count — each one null, and the
  // `source` the reader assigned it rather than the absent field.
  assert.deepEqual(at('2026-08-18T06:38:50.873Z'), [{ recordedAt: '2026-08-18T06:38:50.873Z', command: 'unlabelled', models: ['claude-opus-5[1m]'], source: 'PostToolUse', tokensTotal: null, apiRequests: null, toolCalls: 1, durationMs: 4747, repoKey: null, planSlug: null, planAmbiguous: false, agentId: 'a-legacy' }]);
  // A direct segment contributes exactly one row — the last cumulative row for its (sessionId, segment),
  // never the superseded pair — keyed by command like a subagent run so one join reads both.
  const status = runRows.filter((row) => row.command === 'esq:status');
  assert.deepEqual(status, [{ recordedAt: '2026-08-19T12:02:00.000Z', command: 'esq:status', models: ['claude-opus-5'], source: 'SessionEnd', tokensTotal: 5243, apiRequests: 5, toolCalls: 8, durationMs: 150000, repoKey: KEY_A, planSlug: null, planAmbiguous: false, agentId: null }]);
  // A direct segment carries both halves on its own row — no label is involved — and a segment that
  // declared two plans publishes the ambiguity with its scope intact and no slug anywhere.
  assert.deepEqual(at('2026-08-19T12:03:00.000Z'), [{ recordedAt: '2026-08-19T12:03:00.000Z', command: 'esq:grill', models: ['claude-sonnet-5'], source: 'SessionStop', tokensTotal: 32, apiRequests: 3, toolCalls: 1, durationMs: 70000, repoKey: KEY_A, planSlug: null, planAmbiguous: true, agentId: null }]);
  assert.equal(runRows.filter((row) => row.command === 'esq:plan').length, 5);
  for (const row of runRows.filter((r) => r.command === 'esq:plan')) assert.deepEqual([row.repoKey, row.planSlug, row.planAmbiguous], [KEY_A, 'plan-one', false]);
  // The dropped rows leave no trace: the orphan label's agentId was never a run, and the two noise
  // rows (a slug failing the pattern, a non-integer segment) sealed no segment.
  assert.equal(runRows.filter((row) => row.command === 'esq:check').length, 0);
  assert.equal(at('2026-08-19T14:00:00.000Z').length, 0);
});

// The pair, on the read side. `runRow`'s fallback exists for one case — a chosen run record written
// before repository keys — and it must never buy a slug from one writer with a key from another: the
// join cannot tell a synthesized `(record.repoKey, label.planSlug)` from a declared pair, and a wrong
// attribution is the one failure this whole design refuses. Every case below is one row through the
// real summarizer, asserted as the published pair.
test('runRows publishes an identity only as the pair one writer declared, never two halves from two', async () => {
  const A = 'a'.repeat(32);
  const B = 'b'.repeat(32);
  // One `AgentLabel` + one whole-run record per case, the record stamped at `06:00:0N`
  // so each case is addressable by its own timestamp.
  const spawned = (n, recordKey, labelFields) => [
    { recordedAt: `2026-08-20T05:00:0${n}.000Z`, source: 'AgentLabel', sessionId: 'sp', agentId: `a-${n}`, agentType: 'general-purpose', esqCommand: 'build', ...labelFields },
    { recordedAt: `2026-08-20T06:00:0${n}.000Z`, source: 'SubagentStop', sessionId: 'sp', agentId: `a-${n}`, agentType: 'general-purpose', models: ['claude-opus-5'], durationMs: 1000, toolUseCount: 1, apiRequests: 1, runUsage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, transcriptComplete: true, ...(recordKey === null ? {} : { repoKey: recordKey }) },
  ];
  const CASE = { match: 1, mismatch: 2, keyless: 3, malformed: 4, legacy: 5, orphan: 6 };
  const rows = [
    // The record and the label agree: the pair is published as declared.
    ...spawned(CASE.match, A, { repoKey: A, planSlug: 'plan-match' }),
    // The label names another repository. The row keeps the scope the run actually
    // executed in and publishes no slug — the declaration belongs to a different pair.
    ...spawned(CASE.mismatch, A, { repoKey: B, planSlug: 'plan-mismatch' }),
    // A label with no key at all, and one whose key is not a key: neither can form a
    // pair, so neither can lend its slug to the record's key.
    ...spawned(CASE.keyless, A, { planSlug: 'plan-keyless' }),
    ...spawned(CASE.malformed, A, { repoKey: A.toUpperCase(), planSlug: 'plan-malformed' }),
    // The chosen record predates scoping. With no key of its own it contradicts
    // nothing, so the label supplies both halves together.
    ...spawned(CASE.legacy, null, { repoKey: B, planSlug: 'plan-legacy' }),
    // …and when the label carries no key either, there is no pair to publish at all.
    ...spawned(CASE.orphan, null, { planSlug: 'plan-orphan' }),
  ];
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-telemetry-pair-'));
  const agentFile = path.join(root, 'agent-runs.jsonl');
  await writeFile(agentFile, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
  // One direct segment carrying both halves itself, and one carrying a slug with no
  // valid scope — a slug on an unscoped row can form no pair either.
  const direct = (overrides) => ({ recordedAt: '2026-08-20T07:00:00.000Z', source: 'SessionEnd', sessionId: 'dp', segment: 0, esqCommand: 'plan', via: 'typed', startedAt: '2026-08-20T06:59:00.000Z', lastAt: '2026-08-20T06:59:30.000Z', durationMs: 1000, models: ['claude-opus-5'], apiRequests: 1, toolUseCount: 1, runUsage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, closedBy: 'session-end', ...overrides });
  const sessionFile = path.join(root, 'session-runs.jsonl');
  await writeFile(sessionFile, `${[
    direct({ repoKey: A, planSlug: 'plan-direct' }),
    direct({ recordedAt: '2026-08-20T07:01:00.000Z', segment: 1, esqCommand: 'grill', planSlug: 'plan-unscoped' }),
    direct({ recordedAt: '2026-08-20T07:02:00.000Z', segment: 2, esqCommand: 'converge', repoKey: A, planAmbiguous: true }),
  ].map((row) => JSON.stringify(row)).join('\n')}\n`);

  const { runRows } = await summarizeTelemetry([agentFile, sessionFile], { rows: true });
  const pair = (recordedAt) => {
    const row = runRows.find((r) => r.recordedAt === recordedAt);
    return [row.repoKey, row.planSlug, row.planAmbiguous];
  };
  const spawnedPair = (n) => pair(`2026-08-20T06:00:0${n}.000Z`);
  assert.deepEqual(spawnedPair(CASE.match), [A, 'plan-match', false], 'matching keys publish the declared pair');
  assert.deepEqual(spawnedPair(CASE.mismatch), [A, null, false], 'a label naming another repository lends no slug');
  assert.deepEqual(spawnedPair(CASE.keyless), [A, null, false], 'a keyless label lends no slug');
  assert.deepEqual(spawnedPair(CASE.malformed), [A, null, false], 'a malformed label key lends no slug');
  assert.deepEqual(spawnedPair(CASE.legacy), [B, 'plan-legacy', false], 'a record predating scoping takes both halves from the label');
  assert.deepEqual(spawnedPair(CASE.orphan), [null, null, false], 'no key on either side is no pair');
  assert.deepEqual(pair('2026-08-20T07:00:00.000Z'), [A, 'plan-direct', false], 'a direct row carries both halves itself');
  assert.deepEqual(pair('2026-08-20T07:01:00.000Z'), [null, null, false], 'a slug on an unscoped direct row can form no pair');
  // A key mismatch is an unusable identity, never a competing declaration: it must not
  // arrive as `planAmbiguous`, which is a verdict only the direct writer reaches.
  assert.deepEqual(runRows.filter((r) => r.planAmbiguous), [runRows.find((r) => r.recordedAt === '2026-08-20T07:02:00.000Z')]);
  assert.deepEqual(pair('2026-08-20T07:02:00.000Z'), [A, null, true]);
  // The slugs that could not form a pair reach this surface nowhere at all — not on
  // their own row, and not carried across onto another key.
  const published = runRows.map((r) => r.planSlug);
  for (const slug of ['plan-mismatch', 'plan-keyless', 'plan-malformed', 'plan-orphan', 'plan-unscoped']) {
    assert.ok(!published.includes(slug), `${slug} reached runRows: ${published.join(',')}`);
  }
  assert.deepEqual(published.filter(Boolean).sort(), ['plan-direct', 'plan-legacy', 'plan-match']);
  // And the surface stays off by default, byte for byte, however the pairs resolved.
  const plain = await summarizeTelemetry([agentFile, sessionFile]);
  const { runRows: _rows, ...rest } = await summarizeTelemetry([agentFile, sessionFile], { rows: true });
  assert.equal(JSON.stringify(rest), JSON.stringify(plain));
});

test('runRows carries nothing for a run in EXCLUDED_RUNS', async () => {
  const excludedId = [...EXCLUDED_RUNS.keys()][0];
  const rows = [
    { recordedAt: '2026-08-19T05:00:00.000Z', source: 'AgentLabel', sessionId: 'sk', agentId: 'a-keep', agentType: 'general-purpose', esqCommand: 'build', requestedModel: 'opus' },
    { recordedAt: '2026-08-19T05:00:01.000Z', source: 'SubagentStop', sessionId: 'sk', agentId: 'a-keep', agentType: 'general-purpose', models: ['claude-opus-5'], durationMs: 60000, toolUseCount: 40, apiRequests: 20, runUsage: { input_tokens: 20, output_tokens: 60000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, transcriptComplete: true },
    { recordedAt: '2026-08-19T21:03:39.556Z', source: 'SubagentStop', sessionId: 'sx', agentId: excludedId, agentType: 'general-purpose', models: ['claude-opus-5'], durationMs: 69859, toolUseCount: 18, apiRequests: 14, runUsage: { input_tokens: 28, output_tokens: 4386, cache_creation_input_tokens: 30793, cache_read_input_tokens: 352481 }, transcriptComplete: true },
  ];
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-telemetry-rows-excluded-'));
  const file = path.join(root, 'agent-runs.jsonl');
  await writeFile(file, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
  const { runRows } = await summarizeTelemetry([file], { rows: true });
  // The excluded run leaves every table together, and this surface is one of them — a throwaway run
  // must not enter a join any more than it enters a median.
  assert.deepEqual(runRows, [{ recordedAt: '2026-08-19T05:00:01.000Z', command: 'esq:build', models: ['claude-opus-5'], source: 'SubagentStop', tokensTotal: 60020, apiRequests: 20, toolCalls: 40, durationMs: 60000, repoKey: null, planSlug: null, planAmbiguous: false, agentId: 'a-keep' }]);
});

test('summarizeTelemetry drops a run in EXCLUDED_RUNS from every group, counts it once, and leaves no orphan label', async () => {
  const excludedId = [...EXCLUDED_RUNS.keys()][0];
  const rows = [
    { recordedAt: '2026-08-19T05:00:00.000Z', source: 'AgentLabel', sessionId: 'sk', agentId: 'a-keep', agentType: 'general-purpose', esqCommand: 'build', requestedModel: 'opus' },
    { recordedAt: '2026-08-19T05:00:01.000Z', source: 'SubagentStop', sessionId: 'sk', agentId: 'a-keep', agentType: 'general-purpose', models: ['claude-opus-5'], durationMs: 60000, toolUseCount: 40, apiRequests: 20, runUsage: { input_tokens: 20, output_tokens: 60000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, transcriptComplete: true },
    { recordedAt: '2026-08-19T21:03:39.241Z', source: 'AgentLabel', sessionId: 'sx', agentId: excludedId, agentType: 'general-purpose', esqCommand: 'build', requestedModel: 'opus' },
    { recordedAt: '2026-08-19T21:03:39.245Z', source: 'PostToolUse', sessionId: 'sx', agentId: excludedId, agentType: 'general-purpose', resolvedModel: 'claude-opus-5', durationMs: 69859, toolUseCount: 18, finalRequestTokens: 1000, finalRequestUsage: { input_tokens: 2, cache_creation_input_tokens: 0, cache_read_input_tokens: 900, output_tokens: 98 } },
    { recordedAt: '2026-08-19T21:03:39.556Z', source: 'SubagentStop', sessionId: 'sx', agentId: excludedId, agentType: 'general-purpose', models: ['claude-opus-5'], durationMs: 69859, toolUseCount: 18, apiRequests: 14, runUsage: { input_tokens: 28, output_tokens: 4386, cache_creation_input_tokens: 30793, cache_read_input_tokens: 352481 }, transcriptComplete: true },
  ];
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-telemetry-excluded-'));
  const file = path.join(root, 'agent-runs.jsonl');
  await writeFile(file, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
  const summary = await summarizeTelemetry([file]);

  // Five rows read, one run counted: three of those rows are the excluded run's.
  assert.deepEqual(summary.files, [{ file, rows: 5 }]);
  assert.equal(summary.runs, 1);
  // Counted once per run, not once per row, and not confused with noise, a duplicate or a superseded fallback.
  assert.deepEqual(summary.skipped, { historicalNoise: 0, malformed: 0, duplicates: 0, supersededFallbacks: 0, excluded: 1 });
  // Nothing of it survives into any group: the kept run is the whole of every table.
  assert.deepEqual(Object.keys(summary.byCommand), ['esq:build']);
  assert.equal(summary.byCommand['esq:build'].runs, 1);
  assert.equal(summary.byCommand['esq:build'].tokens.medianOutput, 60000);
  assert.deepEqual(Object.keys(summary.byModel), ['claude-opus-5']);
  assert.equal(summary.byModel['claude-opus-5'].runs, 1);
  assert.deepEqual(Object.keys(summary.byCommandModel), ['esq:build · claude-opus-5']);
  assert.equal(summary.byCommandModel['esq:build · claude-opus-5'].runs, 1);
  assert.equal(summary.byCommandModel['esq:build · claude-opus-5'].tokens.medianOutput, 60000);
  // Its label goes with it — an excluded run must not read as a run still in flight (B-036).
  assert.deepEqual(summary.labelledWithoutRecord, { total: 0, byCommand: {} });
  // Nor does it count as a spawn whose requested model was honored.
  assert.deepEqual(summary.spawnModel, { requested: 1, honored: 1, mismatch: 0, unrequested: 0 });
  // And its timestamps do not widen the reported window.
  assert.deepEqual(summary.window, { first: '2026-08-19T05:00:00.000Z', last: '2026-08-19T05:00:01.000Z' });
  assert.match(renderTelemetrySummary(summary), /1 skipped \(0 noise \/ 0 malformed \/ 0 duplicates \/ 0 superseded fallbacks \/ 1 excluded\)/);

  // Control: the same rows under an agentId nobody excluded are a second run in every group.
  const control = rows.map((row) => (row.agentId === excludedId ? { ...row, agentId: 'a-not-excluded' } : row));
  const controlFile = path.join(root, 'control-runs.jsonl');
  await writeFile(controlFile, `${control.map((row) => JSON.stringify(row)).join('\n')}\n`);
  const controlSummary = await summarizeTelemetry([controlFile]);
  assert.equal(controlSummary.runs, 2);
  assert.equal(controlSummary.skipped.excluded, 0);
  assert.equal(controlSummary.byCommandModel['esq:build · claude-opus-5'].runs, 2);
});

test('summarizeTelemetry on a missing path is an empty report, never a throw', async () => {
  const summary = await summarizeTelemetry([path.join(os.tmpdir(), 'esq-telemetry-missing', 'agent-runs.jsonl')]);
  assert.deepEqual(summary.files, []);
  assert.equal(summary.runs, 0);
  assert.deepEqual(summary.byCommand, {});
  assert.deepEqual(summary.skipped, { historicalNoise: 0, malformed: 0, duplicates: 0, supersededFallbacks: 0, excluded: 0 });
  assert.ok(summary.notes.includes(INTERRUPTED_RUNS_NOTE));
  const searched = await summarizeTelemetry([], { searchedRoot: '/nowhere/plugins/data' });
  assert.ok(searched.notes.includes('no telemetry file found under /nowhere/plugins/data'));
});

test('discoverTelemetryFiles pools the esq-* plugin data dirs, and CLAUDE_PLUGIN_DATA is ignored', async () => {
  const config = await mkdtemp(path.join(os.tmpdir(), 'esq-telemetry-config-'));
  const data = path.join(config, 'plugins/data');
  for (const plugin of ['esq-x', 'other']) {
    await mkdir(path.join(data, plugin, 'telemetry'), { recursive: true });
    await writeFile(path.join(data, plugin, 'telemetry/agent-runs.jsonl'), '');
  }
  await mkdir(path.join(data, 'esq-empty'), { recursive: true });
  const discovered = await discoverTelemetryFiles({ CLAUDE_CONFIG_DIR: config });
  assert.deepEqual(discovered, { root: data, files: [path.join(data, 'esq-x/telemetry/agent-runs.jsonl')] });
  // The env var is a harness→hook channel: exporting it — even to a directory that HAS telemetry
  // files — changes nothing about discovery (B-048; explicit file args are the un-pool lever).
  const exported = await discoverTelemetryFiles({ CLAUDE_CONFIG_DIR: config, CLAUDE_PLUGIN_DATA: path.join(data, 'other') });
  assert.deepEqual(exported, discovered);
  const absent = await discoverTelemetryFiles({ CLAUDE_CONFIG_DIR: path.join(config, 'nope') });
  assert.deepEqual(absent.files, []);
  // session-runs.jsonl is listed beside agent-runs.jsonl when present (by name — the writer's
  // .cursor-*.json sidecars and .claim-* files in the same directory never are), and omitted when absent.
  await writeFile(path.join(data, 'esq-x/telemetry/session-runs.jsonl'), '');
  await writeFile(path.join(data, 'esq-x/telemetry/.cursor-abc.json'), '{}');
  await writeFile(path.join(data, 'esq-x/telemetry/.claim-session-abc'), '');
  await mkdir(path.join(data, 'esq-y/telemetry'), { recursive: true });
  await writeFile(path.join(data, 'esq-y/telemetry/session-runs.jsonl'), '');
  const both = await discoverTelemetryFiles({ CLAUDE_CONFIG_DIR: config });
  assert.deepEqual(both.files, [path.join(data, 'esq-x/telemetry/agent-runs.jsonl'), path.join(data, 'esq-x/telemetry/session-runs.jsonl'), path.join(data, 'esq-y/telemetry/session-runs.jsonl')]);
  const exportedBoth = await discoverTelemetryFiles({ CLAUDE_CONFIG_DIR: config, CLAUDE_PLUGIN_DATA: path.join(data, 'esq-x') });
  assert.deepEqual(exportedBoth.files, both.files);
});

// One telemetry file from a list of rows, for the readers that take file paths directly.
async function assertFixture(rows) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-telemetry-rows-'));
  const file = path.join(root, 'agent-runs.jsonl');
  await writeFile(file, `${rows.map((row) => (typeof row === 'string' ? row : JSON.stringify(row))).join('\n')}\n`);
  return file;
}

test('renderTelemetrySummary prints the header block and five tables, humanised, with the B-036 line and the direct section', async () => {
  const { file } = await telemetryFixture();
  const text = renderTelemetrySummary(await summarizeTelemetry([file]));
  const lines = text.split('\n');
  assert.equal(lines[0], 'esq telemetry summary');
  assert.match(text, /files:\s+\S*agent-runs\.jsonl \(15 rows\)/);
  assert.match(text, /window:\s+2026-08-18 → 2026-08-19/);
  assert.match(text, /runs:\s+7 recorded · 4 with usage · 3 without usage \(2 fallback-only \/ 0 no usage \/ 1 zero usage\) · 4 skipped \(1 noise \/ 1 malformed \/ 1 duplicates \/ 1 superseded fallbacks \/ 0 excluded\)/);
  // The legend sits in the header, once, right after the two count lines (subagent runs, direct
  // segments); a label without a record reads as in flight or interrupted, never as a join failure.
  assert.match(text, /runs:[^\n]*\n  direct:[^\n]*\n  provisional: \* fewer than 5 runs with tokens — no tier or budget is argued from that row\n/);
  assert.match(text, /labelled but unrecorded: 1 \(esq:check 1\) — still running, or interrupted \(B-036\)\n/);
  assert.match(text, /labelled but unrecorded:[^\n]*\n  spawn model: 1 requested \(1 honored \/ 0 mismatch\) · 1 spawned without a model field\n/);
  assert.ok(text.includes(`note:     ${INTERRUPTED_RUNS_NOTE}`));
  // The esq:build line: 2 runs (provisional: under five with tokens), 8.0k output tokens summed, 4.0k median, 1.0M all tokens, 59.9s → 1m00s median, 12 tools median.
  const build = lines.find((line) => /^\s+esq:build\s/.test(line));
  assert.ok(build, 'by command table has an esq:build line');
  assert.deepEqual(build.trim().split(/\s{2,}/), ['esq:build', '2*', '8.0k', '4.0k', '1.0M', '1m00s', '12', '10', '1.20']);
  // A group whose runs include token-less fallback rows says how many the token columns sum; the marker
  // sits on the first number so the cell stays one token.
  const unlabelled = lines.find((line) => /^\s+unlabelled\s/.test(line));
  assert.deepEqual(unlabelled.trim().split(/\s{2,}/), ['unlabelled', '5* (2 w/ tokens)', '120', '60', '140', '4.7s', '1', '1', '0.40']);
  // The zero-usage run sits in the opus runs cell and its duration, never in its token columns.
  const opus = lines.find((line) => /^\s+claude-opus-5\s/.test(line));
  assert.deepEqual(opus.trim().split(/\s{2,}/), ['claude-opus-5', '3* (2 w/ tokens)', '8.0k', '4.0k', '1.0M', '3.0s', '1', '2', '1.14']);
  // Columns are content-sized and the header carries the plan's column names.
  assert.match(text, /\n  command\s+runs\s+out tok Σ\s+out tok med\s+all tok Σ\s+dur med\s+tools med\s+trips med\s+calls\/trip\n/);
  assert.match(text, /\nby agent type\n/);
  assert.match(text, /\nby model\n/);
  const sonnet = lines.find((line) => /^\s+claude-sonnet-5\s/.test(line));
  // The fallback row predates `apiRequests`: both new columns read `—` while its tool and token cells
  // are exactly what they were — the reader must not have altered which runs enter a sample.
  assert.deepEqual(sonnet.trim().split(/\s{2,}/), ['claude-sonnet-5', '1*', '—', '—', '—', '59s', '9', '—', '—']);
  // by command × model: after the three subagent tables, the same columns plus `requested` —
  // `opus ✔` where the orchestrator asked and the run honored it, `—` where no model field was passed.
  assert.match(text, /\nby model\n[^]*\n\nby command × model\n  command · model\s+runs\s+out tok Σ\s+out tok med\s+all tok Σ\s+dur med\s+tools med\s+trips med\s+calls\/trip\s+requested\n/);
  const crossLines = text.slice(text.indexOf('by command × model'), text.indexOf('direct sessions · by command')).split('\n');
  assert.deepEqual(crossLines.find((line) => /^\s+esq:build · claude-opus-5\s/.test(line)).trim().split(/\s{2,}/), ['esq:build · claude-opus-5', '2*', '8.0k', '4.0k', '1.0M', '1m00s', '12', '10', '1.20', 'opus ✔']);
  assert.deepEqual(crossLines.find((line) => /^\s+unlabelled · claude-sonnet-5\s/.test(line)).trim().split(/\s{2,}/), ['unlabelled · claude-sonnet-5', '1*', '—', '—', '—', '59s', '9', '—', '—', '—']);
  // The mark follows the verdict: a mismatch reads `✖`, an asked-for model with no evidence carries no mark.
  const crossed = renderTelemetrySummary(await summarizeTelemetry([await assertFixture([label('x-miss', 'sonnet'), stop('x-miss', ['claude-opus-5']), label('x-blind', 'opus'), stop('x-blind', [])])]));
  assert.match(crossed, /spawn model: 2 requested \(0 honored \/ 1 mismatch\) · 0 spawned without a model field\n/);
  assert.match(crossed, /^\s+esq:build · claude-opus-5\s.*\ssonnet ✖$/m);
  assert.match(crossed, /^\s+esq:build · unknown\s.*\s1\.00\s+opus$/m);
  // A group at the threshold carries no marker; a zero unrecorded count carries no B-036 suffix.
  const provisional = renderTelemetrySummary(await summarizeTelemetry([(await provisionalFixture()).file]));
  const full = provisional.split('\n').find((line) => /^\s+esq:full\s/.test(line));
  assert.deepEqual(full.trim().split(/\s{2,}/).slice(0, 2), ['esq:full', '5']);
  assert.match(provisional, /^\s+esq:thin\s+5\* \(4 w\/ tokens\)\s/m);
  assert.match(provisional, /labelled but unrecorded: 0\n/);
  // Empty summary: every table prints a (none) row, never throws.
  const empty = renderTelemetrySummary(await summarizeTelemetry([]));
  assert.match(empty, /by command\n  command\s+runs[^\n]*\n  \(none\)/);
  assert.match(empty, /by command × model\n  command · model\s+runs[^\n]*requested\n  \(none\)/);
  assert.match(empty, /spawn model: 0 requested \(0 honored \/ 0 mismatch\) · 0 spawned without a model field\n/);
  assert.match(empty, /direct sessions · by command\n  command\s+runs[^\n]*model\s+typed\/skill\n  \(none\)/);
  assert.match(empty, /direct:   0 segments in 0 sessions · 0 open \(no closing marker — running, or the session ended without SessionEnd\) · 0 superseded\n/);
  // The direct section: its own table after the three subagent ones, the same columns plus typed/skill,
  // the provisional marker on the runs cell, and the header line with the direct counts and the note.
  const agent = await telemetryFixture();
  const session = await sessionFixture(agent.root);
  const direct = renderTelemetrySummary(await summarizeTelemetry([agent.file, session.file]));
  assert.match(direct, /files:\s+\S*agent-runs\.jsonl \(15 rows\)\n\s+\S*session-runs\.jsonl \(10 rows\)\n/);
  assert.match(direct, /direct:   7 segments in 2 sessions · 1 open \(no closing marker — running, or the session ended without SessionEnd\) · 1 superseded\n/);
  assert.ok(direct.includes(`note:     ${DIRECT_SEGMENTS_NOTE}`));
  assert.ok(!direct.includes(TELEMETRY_OPT_OUT_NOTE));
  assert.match(direct, /\nby command × model\n[^]*\n\ndirect sessions · by command\n  command\s+runs\s+out tok Σ\s+out tok med\s+all tok Σ\s+dur med\s+tools med\s+trips med\s+calls\/trip\s+model\s+typed\/skill\n/);
  const directLines = direct.slice(direct.indexOf('direct sessions · by command')).split('\n');
  assert.deepEqual(directLines.find((line) => /^\s+esq:status\s/.test(line)).trim().split(/\s{2,}/), ['esq:status', '1*', '40', '40', '5.2k', '2m30s', '8', '5', '1.60', 'claude-opus-5', '1/0']);
  assert.deepEqual(directLines.find((line) => /^\s+esq:plan\s/.test(line)).trim().split(/\s{2,}/), ['esq:plan', '5', '510', '102', '515', '10s', '2', '1', '2.00', 'claude-opus-5+claude-sonnet-5', '0/5']);
  // The subagent by-command table never gains a direct row, and vice versa.
  const subagentTable = direct.slice(direct.indexOf('\nby command\n'), direct.indexOf('\nby agent type\n'));
  assert.ok(!/esq:status|esq:plan|esq:grill/.test(subagentTable));
  assert.ok(!/esq:build|unlabelled/.test(directLines.join('\n')));
  // The opt-out note renders when the CLI's shell is opted out.
  assert.ok(renderTelemetrySummary(await summarizeTelemetry([session.file], { environment: { DO_NOT_TRACK: '1' } })).includes(`note:     ${TELEMETRY_OPT_OUT_NOTE}`));
});

test('esq telemetry summary reads the named file, prints text by default and JSON on --json, and the usage names it', async () => {
  // timeout: a nested execFile that a slow sandbox never returns fails this test by
  // name (ETIMEDOUT / SIGTERM in the kept diagnostics) instead of only tripping
  // audit.sh's outer 120 s bound around the whole suite.
  const run = (file, args, options = {}) => promisify(execFile)(file, args, { timeout: 10_000, ...options });
  const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
  // Every child run pins CLAUDE_CONFIG_DIR to an empty dir and clears CLAUDE_PLUGIN_DATA, so an
  // ambient export on the dev machine can neither reach discovery nor add a note under test.
  const isolated = { ...process.env, CLAUDE_CONFIG_DIR: await mkdtemp(path.join(os.tmpdir(), 'esq-cli-isolated-')), CLAUDE_PLUGIN_DATA: '' };
  const { file } = await telemetryFixture();
  const text = await run(process.execPath, [bin, 'telemetry', 'summary', file], { env: isolated });
  assert.match(text.stdout, /^esq telemetry summary\n/);
  assert.match(text.stdout, /runs:\s+7 recorded · 4 with usage · 3 without usage \(2 fallback-only \/ 0 no usage \/ 1 zero usage\)/);
  assert.ok(!text.stdout.includes(PLUGIN_DATA_ENV_IGNORED_NOTE));
  const json = await run(process.execPath, [bin, 'telemetry', 'summary', '--json', file], { env: isolated });
  const parsed = JSON.parse(json.stdout);
  assert.equal(parsed.runs, 7);
  assert.deepEqual(parsed.withoutUsage, { total: 3, fallbackOnly: 2, noUsage: 0, zeroUsage: 1 });
  assert.equal(parsed.skipped.supersededFallbacks, 1);
  assert.equal(parsed.sampleThreshold, 5);
  assert.equal(parsed.byCommand['esq:build'].provisional, true);
  assert.equal(parsed.byCommand['esq:build'].tokens.medianOutput, 4023.5);
  assert.equal(parsed.byCommandModel['esq:build · claude-opus-5'].verdict, 'honored');
  assert.deepEqual(parsed.spawnModel, { requested: 1, honored: 1, mismatch: 0, unrequested: 1 });
  assert.equal(parsed.direct.segments, 0);
  // A session file alone works, and --json carries the direct numbers; the shell's opt-out is a note.
  const session = await sessionFixture();
  const sessionJson = JSON.parse((await run(process.execPath, [bin, 'telemetry', 'summary', '--json', session.file], { env: { ...isolated, ESQ_TELEMETRY: '0' } })).stdout);
  assert.equal(sessionJson.runs, 0);
  assert.equal(sessionJson.direct.segments, 7);
  assert.equal(sessionJson.direct.open, 1);
  assert.equal(sessionJson.direct.byCommand['esq:status'].tokens.total, 5243);
  assert.equal(sessionJson.direct.byCommand['esq:plan'].provisional, false);
  assert.deepEqual(sessionJson.direct.byCommand['esq:plan'].via, { typed: 0, 'skill-tool': 5 });
  assert.equal(sessionJson.direct.byCommand['esq:plan'].models, 'claude-opus-5+claude-sonnet-5');
  assert.ok(sessionJson.notes.includes(TELEMETRY_OPT_OUT_NOTE));
  const sessionText = await run(process.execPath, [bin, 'telemetry', 'summary', session.file], { env: { ...isolated, ESQ_TELEMETRY: '', DO_NOT_TRACK: '' } });
  assert.match(sessionText.stdout, /direct sessions · by command\n[^]*esq:status\s+1\*/);
  assert.ok(!sessionText.stdout.includes(TELEMETRY_OPT_OUT_NOTE));
  const missing = await run(process.execPath, [bin, 'telemetry', 'summary', path.join(os.tmpdir(), 'esq-telemetry-nowhere.jsonl')], { env: isolated });
  assert.match(missing.stdout, /runs:\s+0 recorded/);
  await assert.rejects(run(process.execPath, [bin, 'telemetry']), (error) => error.code === 2 && /telemetry summary/.test(error.stderr));
});

// ── assert-model (B-042) ──────────────────────────────────────────────────────────────────────────
const label = (agentId, requestedModel, esqCommand = 'build') => ({ recordedAt: '2026-08-19T09:00:00.000Z', source: 'AgentLabel', sessionId: 's9', agentId, agentType: 'general-purpose', esqCommand, ...(requestedModel === undefined ? {} : { requestedModel }) });
const stop = (agentId, models) => ({ recordedAt: '2026-08-19T09:01:00.000Z', source: 'SubagentStop', sessionId: 's9', agentId, agentType: 'general-purpose', models, durationMs: 10, toolUseCount: 1, apiRequests: 1, runUsage: { input_tokens: 1, output_tokens: 2, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }, transcriptComplete: true });
test('B-048 replay: an exported CLAUDE_PLUGIN_DATA does not blind the telemetry reader, and summary names the ignored var', async () => {
  const run = (file, args, options = {}) => promisify(execFile)(file, args, { timeout: 10_000, ...options });
  const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
  // The Phase 4 run 2 shape (2026-08-19): the hooks wrote a labelled, honored spawn to esq-inline
  // under the config dir while the shell exported CLAUDE_PLUGIN_DATA to a root with no telemetry.
  // Pre-fix, discovery honored the export and read the empty root, so a reader saw no rows at all.
  // Post-fix the export changes nothing.
  const config = await mkdtemp(path.join(os.tmpdir(), 'esq-telemetry-replay-'));
  const store = path.join(config, 'plugins/data/esq-inline/telemetry');
  await mkdir(store, { recursive: true });
  await writeFile(path.join(store, 'agent-runs.jsonl'), `${JSON.stringify(label('a1', 'opus'))}\n${JSON.stringify(stop('a1', ['claude-opus-5']))}\n`);
  const env = { ...process.env, CLAUDE_CONFIG_DIR: config, CLAUDE_PLUGIN_DATA: await mkdtemp(path.join(os.tmpdir(), 'esq-telemetry-exported-')) };
  const summary = await run(process.execPath, [bin, 'telemetry', 'summary'], { env });
  assert.match(summary.stdout, /esq-inline[/\\]telemetry[/\\]agent-runs\.jsonl \(2 rows\)/);
  assert.ok(summary.stdout.includes(PLUGIN_DATA_ENV_IGNORED_NOTE));
});


// The three assertions § Expected rendering delta of the execution-log-writer-integrity plan owes:
// a completed entry byte-identical to today when the new keys are absent, each new key in its
// template position when supplied, and the paused heading changed on exactly that one line.
const COMPLETED_CAPTURE = [
  '### Phase 1 — completed 2026-08-22',
  '',
  '**Plan committed at:** 46771fd',
  '',
  '**Commits:** abc1234, def5678',
  '',
  '**What got built:** A schema.',
  '',
  '**Verification:**',
  '- node --test passes',
  '',
  '**Surprises / decisions made during execution:** None — phase executed as planned.',
  '',
  '**Backlog candidates:** None.',
].join('\n');

const NINE_KEY = {
  phase: 1,
  status: 'completed',
  date: '2026-08-22',
  planCommittedAt: '46771fd',
  commits: ['abc1234', 'def5678'],
  whatBuilt: 'A schema.',
  verification: ['node --test passes'],
  surprises: 'None — phase executed as planned.',
  backlogCandidates: 'None.',
};

async function entryFor(payload, name = 'work.md') {
  const root = await fixture();
  const file = path.join(root, 'docs/plans', name);
  await appendLog(file, JSON.stringify(payload));
  const text = await readFile(file, 'utf8');
  // Slice the log span only — the plan's own `### Phase N —` headings sit above it.
  const log = text.slice(text.indexOf('## Execution log'));
  return log.slice(log.indexOf('### Phase ')).trimEnd();
}

test('a completed entry renders byte-identically when the new keys are absent', async () => {
  assert.equal(await entryFor(NINE_KEY), COMPLETED_CAPTURE);
});

test('reconciled and forNextPhase render in their template positions when supplied', async () => {
  const entry = await entryFor({
    ...NINE_KEY,
    reconciled: 'abc1234 was unlogged; the (auto) steps passed and no task was re-implemented.',
    forNextPhase: 'Phase 2 enforces the schema this phase published.',
  });
  // Reconciled sits before What got built; the hand-off note is last
  // and names the phase after this one.
  assert.equal(entry, [
    '### Phase 1 — completed 2026-08-22',
    '',
    '**Plan committed at:** 46771fd',
    '',
    '**Commits:** abc1234, def5678',
    '',
    '**Reconciled:** abc1234 was unlogged; the (auto) steps passed and no task was re-implemented.',
    '',
    '**What got built:** A schema.',
    '',
    '**Verification:**',
    '- node --test passes',
    '',
    '**Surprises / decisions made during execution:** None — phase executed as planned.',
    '',
    '**Backlog candidates:** None.',
    '',
    '**For Phase 2:** Phase 2 enforces the schema this phase published.',
  ].join('\n'));
});

test('a paused entry differs from a completed one by the results heading alone', async () => {
  const shared = { date: '2026-08-22', planCommittedAt: '46771fd', commits: ['abc1234'], whatBuilt: 'Half.', verification: ['unit tests pass'], surprises: 'None.' };
  const completed = await entryFor({ ...shared, phase: 1, status: 'completed' });
  const paused = await entryFor({ ...shared, phase: 1, status: 'paused', manualOutstanding: ['[on /x] click → expect y'] });
  assert.match(paused, /^\*\*Auto verification:\*\*$/m);
  assert.doesNotMatch(paused, /^\*\*Verification:\*\*$/m);
  // Strip what the two formats differ by *structurally* — the heading line and the outstanding
  // block — and the remaining bytes are identical.
  const normalized = paused
    .replace('### Phase 1 — ⏸ awaiting manual verification (2026-08-22)', '### Phase 1 — completed 2026-08-22')
    .replace('**Auto verification:**', '**Verification:**')
    .replace('\n\n**Manual verification outstanding:**\n- [on /x] click → expect y', '');
  assert.equal(normalized, completed);
});

test('an empty commits array renders none rather than an empty field', async () => {
  assert.match(await entryFor({ ...NINE_KEY, commits: [] }), /^\*\*Commits:\*\* none$/m);
});

test('append-log --help prints exactly the schema key set, and prints it from a directory it does not touch', async () => {
  // The key set the help prints is the key set the validator will enforce — one constant, so the
  // documentation cannot drift from the acceptance.
  const help = renderAppendLogHelp();
  const separator = help.split('\n').findIndex((line) => line.startsWith('---'));
  const table = help.split('\n').slice(separator + 1);
  const printed = table.slice(0, table.indexOf(''))
    .filter((line) => /^\S/.test(line))
    .map((line) => line.split(/\s\s+/)[0]);
  assert.deepEqual(printed, LOG_ENTRY_SCHEMA.map((row) => row.key));
  for (const row of LOG_ENTRY_SCHEMA) assert.ok(help.includes(row.label), `${row.key} type missing`);

  // Exit 0, no dependence on the worktree, nothing created or modified — asserted against a
  // sentinel plan path that does not exist, in a directory hashed before and after.
  const run = (file, args, options = {}) => promisify(execFile)(file, args, { timeout: 10_000, ...options });
  const bin = fileURLToPath(new URL('../../plugin/bin/esq', import.meta.url));
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'esq-help-'));
  await writeFile(path.join(cwd, 'bystander.txt'), 'untouched\n');
  const listing = async () => {
    const names = (await readdir(cwd, { recursive: true })).sort();
    const stats = await Promise.all(names.map(async (name) => {
      const info = await stat(path.join(cwd, name));
      return `${name}:${info.size}:${info.mtimeMs}`;
    }));
    return createHash('sha256').update(stats.join('\n')).digest('hex');
  };
  const before = await listing();
  for (const args of [['plan', 'append-log', '--help'], ['plan', 'append-log', 'docs/plans/nonexistent-sentinel.md', '--help']]) {
    const { stdout } = await run(bin, args, { cwd });
    for (const row of LOG_ENTRY_SCHEMA) assert.ok(stdout.includes(row.key), `${row.key} missing from --help`);
    assert.ok(!stdout.includes('nonexistent-sentinel'));
  }
  assert.equal(await listing(), before);
  // A worker that guesses the invocation is pointed at --help rather than at the source.
  await assert.rejects(run(bin, ['plan', 'append-log', 'docs/plans/nonexistent-sentinel.md'], { cwd }), /append-log --help/);
});

// One row per uniform rule in the contract matrix, plus the two illegal combinations. Every one of
// them must leave the target plan byte-identical, which is the whole point of validating before the
// read — so the fixture's hash is asserted after each refusal, not once at the end.
const REFUSALS = [
  ['unknown top-level key', { ...NINE_KEY, typo: 'x' }, /key "typo" is not accepted — accepted on a completed entry: phase, status/],
  ['null in place of a required key', { ...NINE_KEY, whatBuilt: null }, /key "whatBuilt" is null; omit the key instead/],
  ['null in place of an optional key', { ...NINE_KEY, surprises: null }, /key "surprises" is null; omit the key instead/],
  ['missing required key', { ...NINE_KEY, whatBuilt: undefined }, /key "whatBuilt" is required on a completed entry/],
  ['whitespace-only required string', { ...NINE_KEY, whatBuilt: '   \t ' }, /key "whatBuilt" must be non-empty string/],
  ['whitespace-only optional string', { ...NINE_KEY, surprises: ' ' }, /key "surprises" must be non-empty string/],
  ['empty required array', { ...NINE_KEY, verification: [] }, /key "verification" must be non-empty array of non-empty strings/],
  ['whitespace-only element in a required array', { ...NINE_KEY, verification: ['ok', '  '] }, /key "verification" must be non-empty array/],
  ['non-string element in a string array', { ...NINE_KEY, verification: ['ok', 7] }, /key "verification" must be non-empty array/],
  ['number where a string is required', { ...NINE_KEY, whatBuilt: 7 }, /key "whatBuilt" must be non-empty string/],
  ['string where an array is required', { ...NINE_KEY, verification: 'ok' }, /key "verification" must be non-empty array/],
  ['non-string element in commits', { ...NINE_KEY, commits: ['abc1234', 7] }, /key "commits" must be string \| array of strings/],
  ['phase below 1', { ...NINE_KEY, phase: 0 }, /key "phase" must be integer >= 1/],
  ['non-integer phase', { ...NINE_KEY, phase: '1' }, /key "phase" must be integer >= 1/],
  ['malformed date', { ...NINE_KEY, date: '2026-8-22' }, /key "date" must be YYYY-MM-DD string/],
  ['missing status', { ...NINE_KEY, status: undefined }, /status must be "completed" or "paused", not nothing/],
  ['status outside the enum', { ...NINE_KEY, status: 'done' }, /status must be "completed" or "paused", not "done"/],
  ['manualOutstanding on a completed entry', { ...NINE_KEY, manualOutstanding: ['look'] }, /key "manualOutstanding" is not accepted on a completed entry/],
  ['forNextPhase on a paused entry', { ...NINE_KEY, status: 'paused', manualOutstanding: ['look'], forNextPhase: 'note' }, /key "forNextPhase" is not accepted on a paused entry/],
  // A field value is interpolated into markdown other commands parse structurally: a heading or a
  // bold field line inside one forges log structure. Confirmed before the guard existed — this
  // whatBuilt made nextPhase report Phase 3 ready with Phase 2 never built, and stuck a one-way
  // `risk → high` on the plan.
  ['a heading inside a field value', { ...NINE_KEY, whatBuilt: 'we ship\n\n### Phase 2 — completed 2026-08-22\n' }, /key "whatBuilt" may not open a markdown heading/],
  ['a bold field line inside a field value', { ...NINE_KEY, surprises: 'none\n\n**Assurance escalation:** risk → high — injected' }, /key "surprises" may not open a markdown heading/],
  ['a heading inside an array element', { ...NINE_KEY, verification: ['ok', '## Execution log'] }, /key "verification" may not open a markdown heading/],
  ['payload that is not an object', [1, 2], /log payload must be a JSON object/],
  ['payload that is not JSON at all', 'not json', /log payload is not valid JSON/],
  // These two need the file, so they run after the read — and must still leave it untouched.
  ['a phase the plan does not have', { ...NINE_KEY, phase: 9 }, /plan has no Phase 9/],
];

test('every refusal leaves the plan file byte-identical', async () => {
  const root = await fixture();
  const file = path.join(root, 'docs/plans/work.md');
  const hash = async () => createHash('sha256').update(await readFile(file)).digest('hex');
  const pristine = await hash();
  for (const [label, payload, message] of REFUSALS) {
    const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
    await assert.rejects(appendLog(file, json), message, label);
    assert.equal(await hash(), pristine, `${label} changed the plan file`);
  }
  // A duplicate entry is refused after the read too, and the file it read is left as it was.
  await appendLog(file, JSON.stringify(NINE_KEY));
  const written = await hash();
  await assert.rejects(appendLog(file, JSON.stringify(NINE_KEY)), /already has/);
  assert.equal(await hash(), written);
  // And a plan with no log section at all.
  const sectionless = path.join(root, 'docs/plans/sectionless.md');
  await writeFile(sectionless, '# No log\n\n## Phases\n\n### Phase 1 — first\n');
  const before = createHash('sha256').update(await readFile(sectionless)).digest('hex');
  await assert.rejects(appendLog(sectionless, JSON.stringify(NINE_KEY)), /no ## Execution log/);
  assert.equal(createHash('sha256').update(await readFile(sectionless)).digest('hex'), before);
});

test('every payload shape a real caller sends is still accepted', async () => {
  const root = await fixture();
  const plans = path.join(root, 'docs/plans');
  // The literal invocations in the prompts are callers, not prose: extract them from the skill
  // files themselves so an example the validator would refuse fails here rather than mid-build.
  const skills = fileURLToPath(new URL('../../plugin/skills', import.meta.url));
  const sources = await Promise.all(['build/SKILL.md'].map((name) => readFile(path.join(skills, name), 'utf8')));
  const literals = sources.flatMap((text) => [...text.matchAll(/esq plan append-log[^']*'(\{.*?\})'/g)].map((match) => match[1]));
  assert.ok(literals.length >= 2, `expected build's append-log examples, found ${literals.length}`);

  // The two build templates and the dominant nine-key census shape, as § Caller inventory records
  // them — reasoned about nowhere, replayed here.
  const inventory = [
    { ...NINE_KEY, forNextPhase: 'note' },
    { phase: 1, status: 'paused', date: '2026-08-22', planCommittedAt: '46771fd', commits: ['abc1234'], whatBuilt: 'x', verification: ['ok'], manualOutstanding: ['[on /x] click → expect y'], surprises: 'None.' },
    { phase: 1, status: 'completed', planCommittedAt: 'unversioned', commits: ['abc1234'], whatBuilt: 'x', verification: ['ok'] },
    NINE_KEY,
    // commits is the one key an empty array is legal for.
    { ...NINE_KEY, commits: [] },
    // A single string is as legal as an array of them.
    { ...NINE_KEY, commits: 'abc1234' },
    // Plain bullets stay legal — the completed template renders surprises as a bullet list.
    { ...NINE_KEY, surprises: 'two things\n- the first\n- the second' },
  ];

  const payloads = [...literals, ...inventory.map((entry) => JSON.stringify(entry))];
  for (const [index, json] of payloads.entries()) {
    const file = path.join(plans, `caller-${index}.md`);
    await writeFile(file, '# Caller\n\n## Phases\n\n### Phase 1 — first\n\n### Phase 3 — third\n\n## Execution log\n');
    await appendLog(file, json);
    const text = await readFile(file, 'utf8');
    assert.match(text.slice(text.indexOf('## Execution log')), /### Phase \d+ — (completed|⏸ awaiting)/, `payload ${index} rendered no entry`);
  }
});

// ── Harness evidence ─────────────────────────────────────────────────────────
// Every case below fabricates the installed version through the `ESQ_TEST_CLAUDE_VERSION` seam. No test
// here executes `claude`: a suite that spawned the real binary would measure the machine it happens to
// run on rather than the case it states, and would go red on every upgrade.

const EVIDENCE_HEADER = '| Measurement | Claim | Governs | Capture | Version | Measured | Refreshed by | State |\n|---|---|---|---|---|---|---|---|';

function evidenceCapture(version) {
  return `${JSON.stringify({ type: 'probe-evidence', exit: 0, init: { model: 'claude-opus-5', claude_code_version: version } })}\n`;
}

async function evidenceFixture(rows, { captures = {}, installed = '2.1.258', evidenceDir = null } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-evidence-'));
  await mkdir(path.join(root, 'docs'), { recursive: true });
  if (rows !== null) {
    const body = rows.map((cells) => `| ${cells.join(' | ')} |`).join('\n');
    await writeFile(path.join(root, 'docs/EVIDENCE.md'), `# Harness evidence registry\n\n${EVIDENCE_HEADER}\n${body}\n`);
  }
  for (const [file, text] of Object.entries(captures)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), text);
  }
  if (evidenceDir) {
    await mkdir(path.join(root, 'docs/evidence'), { recursive: true });
    for (const name of evidenceDir) await writeFile(path.join(root, 'docs/evidence', name), evidenceCapture('2.1.258'));
  }
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  if (installed === null) delete process.env.ESQ_TEST_CLAUDE_VERSION;
  else process.env.ESQ_TEST_CLAUDE_VERSION = installed;
  return root;
}

const routingRow = (version, state = 'current', id = 'M-agent-model-one') =>
  [id, 'E-model-routing', 'model-routing', 'docs/captures/routing.jsonl', version, '2026-08-19', '`node scripts/probe-model-pins.mjs`', state];

test('evidence reports fresh, stale and never-measured per claim', async () => {
  const root = await evidenceFixture([
    routingRow('2.1.258'),
    ['M-journeys-one', 'E-journeys', '—', 'docs/captures/journeys.jsonl', '2.1.251', '2026-08-30', '`node scripts/smoke-journeys.mjs`', 'current'],
    ['M-pin-pending', 'E-interactive-pin', '—', '—', '—', '—', 'README § the protocol', 'never-measured'],
  ], { captures: { 'docs/captures/routing.jsonl': evidenceCapture('2.1.258'), 'docs/captures/journeys.jsonl': evidenceCapture('2.1.251') } });
  const report = await evidence(root);
  assert.deepEqual(report.findings, []);
  assert.deepEqual(report.claims.map((claim) => [claim.claim, claim.verdict]), [
    ['E-model-routing', 'fresh'], ['E-journeys', 'stale'], ['E-interactive-pin', 'never-measured'],
  ]);
  // No claim carries a routing verdict any more: `esq evidence` computes, and nothing routes on it.
  assert.deepEqual(report.claims.map((claim) => claim.relay), [undefined, undefined, undefined]);
  assert.equal(report.relay, undefined);
  assert.equal(report.claims[0].measurement, 'M-agent-model-one');
  assert.equal(report.installed.version, '2.1.258');
  // A never-measured claim never gates anything, in any state.
  assert.equal(report.claims[2].governs, null);
  // The prose form names the same three verdicts and the relay line.
  const rendered = renderEvidence(report);
  assert.match(rendered, /fresh\s+E-model-routing · governs model-routing/);
  assert.match(rendered, /Findings: none\./);
});

test('an unreadable installed version is unknown, never fresh — the corrected unknown rule', async () => {
  const root = await evidenceFixture([routingRow('2.1.258')], { captures: { 'docs/captures/routing.jsonl': evidenceCapture('2.1.258') }, installed: null });
  const report = await evidence(root);
  // The row is structurally perfect and matches the version a reader would have guessed; it is still not fresh.
  assert.deepEqual(report.findings, []);
  assert.equal(report.claims[0].verdict, 'unknown');
  assert.equal(report.installed.version, null);
});

test('the structural refusals: a duplicate measurement ID, two current rows for one claim, and an out-of-set state or governs', async () => {
  const capture = { 'docs/captures/routing.jsonl': evidenceCapture('2.1.258') };
  const duplicate = await evidenceFixture([routingRow('2.1.258'), routingRow('2.1.258', 'superseded')], { captures: capture });
  const duplicateReport = await evidence(duplicate);
  assert.ok(duplicateReport.findings.some((finding) => finding.includes('duplicate measurement ID: M-agent-model-one')));
  assert.equal(duplicateReport.claims[0].verdict, 'unknown');

  const twoCurrent = await evidenceFixture([routingRow('2.1.258'), routingRow('2.1.258', 'current', 'M-agent-model-two')], { captures: capture });
  const twoReport = await evidence(twoCurrent);
  assert.ok(twoReport.findings.some((finding) => finding.includes('claim E-model-routing has 2 current measurements')));
  assert.equal(twoReport.claims[0].verdict, 'unknown');

  const badState = await evidenceFixture([['M-x', 'E-model-routing', 'model-routing', 'docs/captures/routing.jsonl', '2.1.258', '2026-08-19', 'cmd', 'latest']], { captures: capture });
  const stateReport = await evidence(badState);
  assert.ok(stateReport.findings.some((finding) => finding.includes('invalid state on M-x: latest')));
  assert.equal(stateReport.claims[0].verdict, 'unknown');

  const badGoverns = await evidenceFixture([['M-x', 'E-anything', 'everything', 'docs/captures/routing.jsonl', '2.1.258', '2026-08-19', 'cmd', 'current']], { captures: capture });
  const governsReport = await evidence(badGoverns);
  assert.ok(governsReport.findings.some((finding) => finding.includes('invalid governs on M-x: everything')));
  // An unrecognised governs value is a structural finding on the row that carries it.

  const measuredNever = await evidenceFixture([['M-x', 'E-interactive-pin', '—', 'docs/captures/routing.jsonl', '2.1.258', '—', 'cmd', 'never-measured']], { captures: capture });
  assert.ok((await evidence(measuredNever)).findings.some((finding) => finding.includes('is never-measured but names a capture')));
});

test('a measured row that names no capture is refused, in every state past never-measured', async () => {
  const capture = { 'docs/captures/routing.jsonl': evidenceCapture('2.1.258') };

  // The mirror of the never-measured-with-a-capture case above: past never-measured, a Capture cell is
  // owed. This is the rule README § "The interactive pin" has to obey — a protocol that tells a
  // maintainer to append a captureless `current` row documents a registry the reader will not accept.
  for (const cell of ['—', '']) {
    const root = await evidenceFixture([['M-x', 'E-interactive-pin', '—', cell, '2.1.258', '2026-09-03', 'README § the protocol', 'current']], { captures: capture });
    const report = await evidence(root);
    assert.ok(report.findings.some((finding) => finding.includes('M-x names no capture')), `current/${cell || '(empty)'} → ${report.findings.join(' / ')}`);
    assert.equal(report.claims[0].verdict, 'unknown');
  }

  // Superseded owes one too — and pairing it with a well-formed current row proves the finding comes
  // from the capture rule rather than from the claim having no current measurement.
  const superseded = await evidenceFixture([
    ['M-old', 'E-interactive-pin', '—', '—', '2.1.251', '2026-08-30', 'README § the protocol', 'superseded'],
    ['M-new', 'E-interactive-pin', '—', 'docs/captures/routing.jsonl', '2.1.258', '2026-09-03', 'README § the protocol', 'current'],
  ], { captures: capture });
  const supersededReport = await evidence(superseded);
  assert.ok(supersededReport.findings.some((finding) => finding.includes('M-old names no capture')), supersededReport.findings.join(' / '));
  assert.equal(supersededReport.claims[0].verdict, 'unknown');
  assert.equal(supersededReport.claims[0].reason, 'a row for this claim is malformed');
});

test('a capture path that escapes the repository is refused before it is read', async () => {
  const capture = { 'docs/captures/routing.jsonl': evidenceCapture('2.1.258') };
  for (const [cell, fragment] of [['../outside.jsonl', 'escapes the repository'], ['docs/../../outside.jsonl', 'escapes the repository'], ['/etc/hostname', 'not repo-relative']]) {
    const root = await evidenceFixture([['M-x', 'E-model-routing', 'model-routing', cell, '2.1.258', '2026-08-19', 'cmd', 'current']], { captures: capture });
    const report = await evidence(root);
    assert.ok(report.findings.some((finding) => finding.includes(fragment)), `${cell} → ${report.findings.join(' / ')}`);
    assert.equal(report.claims[0].verdict, 'unknown');
  }
});

test('a capture whose recorded version disagrees with its cell, records none, or is not JSONL, is malformed', async () => {
  const disagree = await evidenceFixture([routingRow('2.1.258')], { captures: { 'docs/captures/routing.jsonl': evidenceCapture('2.1.235') } });
  const disagreeReport = await evidence(disagree);
  assert.ok(disagreeReport.findings.some((finding) => finding.includes('records 2.1.258, but its capture records 2.1.235')));
  assert.equal(disagreeReport.claims[0].verdict, 'unknown');

  const versionless = await evidenceFixture([routingRow('2.1.258')], { captures: { 'docs/captures/routing.jsonl': '{"type":"probe-row","path":"typed /skill"}\n' } });
  assert.ok((await evidence(versionless)).findings.some((finding) => finding.includes('records no Claude Code version')));

  const notJson = await evidenceFixture([routingRow('2.1.258')], { captures: { 'docs/captures/routing.jsonl': 'not json at all\n' } });
  assert.ok((await evidence(notJson)).findings.some((finding) => finding.includes('is not readable as JSONL')));

  const missing = await evidenceFixture([routingRow('2.1.258')]);
  assert.ok((await evidence(missing)).findings.some((finding) => finding.includes('names a capture that cannot be read')));

  // Two versions in one file is not one measurement — the per-row `cc` column exists to make that visible.
  const merged = await evidenceFixture([routingRow('2.1.258')], { captures: { 'docs/captures/routing.jsonl': `${evidenceCapture('2.1.258')}${evidenceCapture('2.1.251')}` } });
  assert.ok((await evidence(merged)).findings.some((finding) => finding.includes('records more than one Claude Code version')));
});

test('a capture written under docs/evidence/ but never registered is listed, and a missing directory is not a finding', async () => {
  const capture = { 'docs/captures/routing.jsonl': evidenceCapture('2.1.258') };
  const none = await evidenceFixture([routingRow('2.1.258')], { captures: capture });
  assert.deepEqual((await evidence(none)).unregistered, []);

  const written = await evidenceFixture([routingRow('2.1.258')], { captures: capture, evidenceDir: ['2026-09-02-agent-model.jsonl'] });
  const report = await evidence(written);
  assert.deepEqual(report.unregistered, ['docs/evidence/2026-09-02-agent-model.jsonl']);
  // Visible, but not a defect in the tree: the row is what activates it, and only a person writes that.
  assert.deepEqual(report.findings, []);
  assert.match(renderEvidence(report), /Unregistered captures \(written, never activated\)/);
});

// ── The write-only backlog, replayed ─────────────────────────────────────────
// The sequence that produced the `plan → -fixes → -fixes-fixes` chain in this repository: a phase
// finds a defect in code its own shipping unit wrote, files a backlog row for it, and logs itself
// `completed`. Nothing downstream reads that row, so the unit lands with its own bug open. The gate
// is in `append-log` because that is the moment the claim is made.

async function unitFixture(rows, { branch = '**Branch:** esq/stem\n**Origin:** main\n' } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-unit-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  const header = '| ID | Date | Type | Pri | Summary | Source | Epic | Version | Status |\n|---|---|---|---|---|---|---|---|---|\n';
  const body = rows.map(([id, type, source, status]) => `| ${id} | 2026-09-09 | ${type} | | summary of ${id} | ${source} | | | ${status} |\n`).join('');
  await writeFile(path.join(root, 'docs/BACKLOG.md'), `# Backlog\n\n${header}${body}`);
  const file = path.join(root, 'docs/plans/2026-09-09-stem-fixes.md');
  await writeFile(file, `# Stem\n\n${branch}\n## Phases\n\n### Phase 1 — first\n- task\n\n### Phase 2 — second\n- task\n\n## Execution log\n<!-- Appended by /esq:build -->\n`);
  return { root, file };
}

const completed = (phase = 1) => JSON.stringify({ phase, status: 'completed', commits: ['abc1234'], whatBuilt: 'a thing', verification: ['ok'] });

test('append-log refuses a completed entry while a defect this unit filed against itself stands undisposed', async () => {
  const { file } = await unitFixture([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);
  const before = await readFile(file, 'utf8');
  await assert.rejects(appendLog(file, completed()), /B-201 \(bug, Open\)/);
  // Refused before the plan file is read, exactly as every schema refusal is.
  assert.equal(await readFile(file, 'utf8'), before);
});

test('the disposition that releases the gate is the closed status vocabulary /esq:backlog already writes', async () => {
  for (const status of ['Done', 'Dropped']) {
    const { file } = await unitFixture([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', status]]);
    await appendLog(file, completed());
    assert.match(await readFile(file, 'utf8'), /### Phase 1 — completed /);
  }
  for (const status of ['Open', 'Planned', 'Needs-decision']) {
    const { file } = await unitFixture([['B-201', '⚠️ debt', 'fix: 2026-09-09-stem-fixes', status]]);
    await assert.rejects(appendLog(file, completed()), new RegExp(`B-201 \\(debt, ${status}\\)`));
  }
});

test('what never blocks: a 💡 idea by type, a finder row by source verb, another unit by branch, and a plan that records none', async () => {
  const rows = [
    ['B-201', '💡 idea', 'build: stem-fixes Phase 1', 'Open'],
    ['B-202', '⚠️ debt', 'check: stem-fixes', 'Open'],
    ['B-203', '🐛 bug', 'review: stem-fixes', 'Open'],
    ['B-204', '🐛 bug', 'build: some-other-plan Phase 1', 'Open'],
    ['B-205', '🐛 bug', 'manual', 'Open'],
  ];
  const { file } = await unitFixture(rows);
  await appendLog(file, completed());
  assert.match(await readFile(file, 'utf8'), /### Phase 1 — completed /);

  // A plan recording no **Branch:** belongs to no unit, so even a matching 🐛 row cannot reach it.
  const orphan = await unitFixture([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']], { branch: '' });
  await appendLog(orphan.file, completed());
  assert.match(await readFile(orphan.file, 'utf8'), /### Phase 1 — completed /);
});

// A plan whose three phases differ in exactly what the refusal below keys off: Phase 1 names one
// resolvable `(auto)` command (plus an unresolvable step, which proves nothing and is asked for
// nothing), Phase 2 is manual-only, Phase 3 names one command and is used for the pause.
const PROVENANCE_PLAN = [
  '# A plan', '', '## Phases', '',
  '### Phase 1 — one',
  '- **Verification:**',
  '  - `(auto)` `node --test tests/one.test.mjs` — the suite is green',
  '  - `(auto)` `pnpm build` and `pnpm lint` — both clean',
  '  - `(manual)` [on /] look → expect: it renders',
  '',
  '### Phase 2 — two',
  '- **Verification:**',
  '  - `(manual)` [on /] look → expect: it renders',
  '',
  '### Phase 3 — three',
  '- **Verification:**',
  '  - `(auto)` `pnpm test` — the suite is green',
  '',
  '## Execution log',
  '<!-- Appended by /esq:build -->',
  '',
].join('\n');

async function provenanceFixture(text = PROVENANCE_PLAN) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-provenance-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  const file = path.join(root, 'docs/plans/p.md');
  await writeFile(file, text);
  return file;
}

const PROVEN = 'a'.repeat(40);

test('a completed entry cannot drop the provenance its phase\'s resolvable (auto) commands earn', async () => {
  const file = await provenanceFixture();
  const before = await readFile(file, 'utf8');
  const payload = (extra) => JSON.stringify({ phase: 1, status: 'completed', commits: ['abc1234'], whatBuilt: 'the code', verification: ['(auto) node --test tests/one.test.mjs — 12 pass'], ...extra });

  // The omission: refused, naming the command the landing would otherwise re-run — and only that
  // one, since the second step's command cannot be resolved and proves nothing either way.
  await assert.rejects(appendLog(file, payload()), (error) => {
    assert.match(error.message, /Phase 1 cannot log completed without its verified provenance/);
    assert.match(error.message, /`node --test tests\/one\.test\.mjs`/);
    assert.doesNotMatch(error.message, /pnpm build/);
    // It says what honest evidence is missing, never a command to re-run to produce it.
    assert.match(error.message, /git rev-parse HEAD/);
    assert.match(error.message, /judged PASS on this tree/);
    assert.match(error.message, /The plan file is unchanged\./);
    return true;
  });
  assert.equal(await readFile(file, 'utf8'), before);

  // The same payload with the block: accepted, and the block renders where the gate reads it.
  await appendLog(file, payload({ verified: { at: PROVEN, commands: ['node --test tests/one.test.mjs'] } }));
  assert.deepEqual(parseVerified(await readFile(file, 'utf8')).get(1), [{ phase: 1, at: PROVEN, commands: ['node --test tests/one.test.mjs'] }]);

  // A phase whose verification names no resolvable `(auto)` command is asked for nothing: there is
  // no reuse to lose, and demanding a block here would buy a fabricated one.
  await appendLog(file, JSON.stringify({ phase: 2, status: 'completed', commits: ['def5678'], whatBuilt: 'the screen', verification: ['(manual) confirmed — the page renders'] }));
  assert.match(await readFile(file, 'utf8'), /### Phase 2 — completed /);

  // A pause that names a blocker keeps the block optional: it may have stopped before judging its
  // steps, and `plan resolve-block` proves every owed command green before it becomes completed.
  await appendLog(file, JSON.stringify({ phase: 3, status: 'paused', commits: ['fed4321'], whatBuilt: 'half', verification: ['(auto) pnpm test — 3 pass'], blockedBy: ['B-201 (bug, Open) — summary of B-201'] }));
  assert.equal(parsePlan(await readFile(file, 'utf8')).entries.get(3).status, 'paused');

  // History is untouched: an entry already on disk with no block is neither re-validated nor
  // rewritten when a later phase logs, so no old plan is retroactively invalid.
  const historical = await provenanceFixture(`${PROVENANCE_PLAN}\n### Phase 1 — completed 2026-09-09\n\n**Commits:** abc1234\n\n**What got built:** the code\n\n**Verification:**\n- ok\n`);
  const legacy = await readFile(historical, 'utf8');
  await appendLog(historical, JSON.stringify({ phase: 2, status: 'completed', commits: ['def5678'], whatBuilt: 'the screen', verification: ['(manual) confirmed'] }));
  const after = await readFile(historical, 'utf8');
  assert.ok(after.startsWith(legacy.trimEnd()));
  assert.equal(parseVerified(after).size, 0);
});

test('a pause owing only (manual) steps carries the same provenance a completed entry owes', async () => {
  // The phase judged every `(auto)` step PASS — that is what this clause of the pause means — so the
  // evidence is in the worker's hands at this call, and dropping it here is what leaves the run that
  // confirms the observation with a command to re-buy (B-152).
  const file = await provenanceFixture();
  const before = await readFile(file, 'utf8');
  const paused = (extra) => JSON.stringify({ phase: 3, status: 'paused', commits: ['fed4321'], whatBuilt: 'half', verification: ['(auto) pnpm test — 3 pass'], manualOutstanding: ['[on /] look → expect: it renders'], ...extra });

  await assert.rejects(appendLog(file, paused()), (error) => {
    assert.match(error.message, /Phase 3 cannot log paused without its verified provenance/);
    assert.match(error.message, /`pnpm test`/);
    // It names what the omission costs at the resume, not at the landing — that is where this pause
    // is settled — and the one honest way out for a phase that cannot state both halves.
    assert.match(error.message, /esq plan resolve-block/);
    assert.match(error.message, /pause on it with "blockedBy"/);
    assert.match(error.message, /The plan file is unchanged\./);
    return true;
  });
  assert.equal(await readFile(file, 'utf8'), before);

  // With the block: accepted, and `parseVerified` reads it off the paused entry, which is the whole
  // point — the proof is readable by the gate before the phase is ever completed.
  await appendLog(file, paused({ verified: { at: PROVEN, commands: ['pnpm test'] } }));
  const text = await readFile(file, 'utf8');
  assert.match(text, /### Phase 3 — ⏸ awaiting manual verification/);
  assert.deepEqual(parseVerified(text).get(3), [{ phase: 3, at: PROVEN, commands: ['pnpm test'] }]);

  // A manual-only pause whose phase names no resolvable `(auto)` command is asked for nothing: there
  // is no proof to lose, and demanding one would buy a fabricated block.
  const manualOnly = await provenanceFixture();
  await appendLog(manualOnly, JSON.stringify({ phase: 2, status: 'paused', commits: ['def5678'], whatBuilt: 'the screen', verification: ['(auto) nothing to run'], manualOutstanding: ['[on /] look → expect: it renders'] }));
  assert.equal(parsePlan(await readFile(manualOnly, 'utf8')).entries.get(2).status, 'paused');

  // And a pause carrying both causes reads as blocked, where the block stays optional.
  const both = await provenanceFixture();
  await appendLog(both, JSON.stringify({ phase: 3, status: 'paused', commits: ['fed4321'], whatBuilt: 'half', verification: ['(auto) pnpm test — 3 pass'], blockedBy: ['B-201 (bug, Open) — summary'], manualOutstanding: ['[on /] look → expect: it renders'] }));
  assert.match(await readFile(both, 'utf8'), /### Phase 3 — ⏸ blocked on an open same-unit defect/);
});

test('a pause has two causes and must name one: blockedBy, manualOutstanding, or both — never neither', async () => {
  const { file } = await unitFixture([['B-201', '🐛 bug', 'build: stem-fixes Phase 1', 'Open']]);

  // blockedBy alone: the second cause, and the heading says which one it is.
  await appendLog(file, JSON.stringify({ phase: 1, status: 'paused', commits: ['abc1234'], whatBuilt: 'the code', verification: ['ok'], blockedBy: ['B-201 (bug, Open) — summary of B-201'] }));
  const text = await readFile(file, 'utf8');
  assert.match(text, /### Phase 1 — ⏸ blocked on an open same-unit defect \(\d{4}-\d{2}-\d{2}\)/);
  assert.match(text, /\*\*Blocked by:\*\*\n- B-201 \(bug, Open\) — summary of B-201/);
  // Every consumer routes on the glyph, so the second clause parses as paused with no parser change.
  assert.equal(parsePlan(text).entries.get(1).status, 'paused');
  assert.equal(nextPhase(parsePlan(text)).state, 'paused');

  // Both: blocked wins the heading, and the manual steps are still listed.
  const both = await unitFixture([]);
  await appendLog(both.file, JSON.stringify({ phase: 1, status: 'paused', commits: ['abc1234'], whatBuilt: 'the code', verification: ['ok'], blockedBy: ['B-201'], manualOutstanding: ['[on /settings] toggle → expect a repaint'] }));
  const bothText = await readFile(both.file, 'utf8');
  assert.match(bothText, /### Phase 1 — ⏸ blocked on an open same-unit defect/);
  assert.match(bothText, /\*\*Manual verification outstanding:\*\*/);

  // Neither: a pause that will not say why it paused.
  const silent = await unitFixture([]);
  await assert.rejects(
    appendLog(silent.file, JSON.stringify({ phase: 1, status: 'paused', commits: ['abc1234'], whatBuilt: 'the code', verification: ['ok'] })),
    /must carry "manualOutstanding".*or "blockedBy"/s,
  );
  // And blockedBy is legal on a paused entry only.
  await assert.rejects(
    appendLog(silent.file, JSON.stringify({ phase: 1, status: 'completed', commits: ['abc1234'], whatBuilt: 'the code', verification: ['ok'], blockedBy: ['B-201'] })),
    /"blockedBy" is not accepted on a completed entry/,
  );
});

test('brief depth counts corrective generations, not filename suffixes, and names the bound', async () => {
  // Depth 0: a plain plan opens generation 1, which is inside the bound.
  assert.deepEqual(briefDepth('docs/plans/2026-09-19-stop-applies-its-own-fix.md'), {
    stem: 'stop-applies-its-own-fix',
    depth: 0,
    nextGeneration: 1,
    bound: 2,
    verdict: 'open',
  });

  // One round back, as a plan and as the brief that produced it — same generation, same stem.
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes.md').depth, 1);
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes.brief.md').depth, 1);
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes.brief.md').stem, 'alpha');

  // A uniquifier is a second brief inside one round, never a round of its own: `-fixes-2` is still
  // generation 1. Reading it as 2 is what would silently spend the bound on one correction.
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes-2.md').depth, 1);
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes-2.brief.md').depth, 1);

  // A correction of a correction is generation 2 — and the observed four-generation specimen is 3.
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes-fixes.md').depth, 2);
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes-2-fixes-fixes-2.brief.md').depth, 3);
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes-2-fixes-fixes-2.brief.md').stem, 'alpha');

  // `prefixes` ends in those letters without the hyphen: not a corrective name at all.
  assert.deepEqual(
    { stem: briefDepth('docs/plans/2026-09-19-prefixes.md').stem, depth: briefDepth('docs/plans/2026-09-19-prefixes.md').depth },
    { stem: 'prefixes', depth: 0 },
  );

  // The boundary: the bound is on the generation about to be opened, so depth 1 is still `open`
  // (it would open 2) and depth 2 is `exhausted` (it would open 3).
  assert.deepEqual(
    ['', '-fixes', '-fixes-fixes', '-fixes-fixes-fixes'].map((suffix) => briefDepth(`docs/plans/2026-09-19-alpha${suffix}.md`).verdict),
    ['open', 'open', 'exhausted', 'exhausted'],
  );
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes.md').nextGeneration, 2);
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes-fixes.md').nextGeneration, 3);

  // The same boundary over brief paths, which is what every skill actually hands the verb. A brief's
  // own `-fixes` group *is* the round it opens — `<stem>-fixes-fixes.brief.md` is written over the
  // generation-1 plan and opens generation 2, still `open`, while the plan of that same name would
  // open 3 and is `exhausted`. Walking only `.md` paths here is what let the off-by-one ship.
  assert.deepEqual(
    ['-fixes', '-fixes-2', '-fixes-fixes', '-fixes-fixes-fixes'].map((suffix) => briefDepth(`docs/plans/2026-09-19-alpha${suffix}.brief.md`).verdict),
    ['open', 'open', 'open', 'exhausted'],
  );
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes.brief.md').nextGeneration, 1);
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes-2.brief.md').nextGeneration, 1);
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes-fixes.brief.md').nextGeneration, 2);
  assert.equal(briefDepth('docs/plans/2026-09-19-alpha-fixes-fixes-fixes.brief.md').nextGeneration, 3);

  // Neither a plan nor a brief: refused by name rather than answered `depth: 0`, which is the one
  // wrong answer a caller could not tell from a right one.
  assert.throws(() => briefDepth('docs/plans/notes.txt'), /reads a plan file or a brief/);
  assert.throws(() => briefDepth('docs/plans/2026-09-19-alpha.log.md'), /reads a plan file or a brief/);
});

// The defect this verb exists for, reproduced: two briefs on disk, both already planned, and the
// most recently modified of them is the one a bare `/esq:plan` used to re-plan. Consumption is a
// computed fact — the plan beside the brief carrying its slug — never an mtime and never a deletion.
test('brief pending answers which briefs still owe a plan, and never the newest already-planned one', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-cli-pending-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  const plans = path.join(root, 'docs/plans');
  const write = (name, body) => writeFile(path.join(plans, name), body);
  const plan = (title) => `# ${title}\n\n## Phases\n\n### Phase 1 — one\n- task\n\n## Execution log\n<!-- Appended by /esq:build -->\n`;
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;

  await write('2026-09-01-refonte-visuelle-six-pages.brief.md', '# Brief: refonte\n');
  await write('2026-09-02-refonte-visuelle-six-pages.md', plan('Refonte'));
  await write('2026-09-03-nouvelle-entree.brief.md', '# Brief: nouvelle entree\n');
  // The planned brief is the freshest file in the directory: mtime would hand it back, the slug join
  // does not.
  const fresh = new Date('2026-09-30T12:00:00Z');
  await utimes(path.join(plans, '2026-09-01-refonte-visuelle-six-pages.brief.md'), fresh, fresh);

  const first = await briefPending(root);
  assert.equal(first.selected, 'docs/plans/2026-09-03-nouvelle-entree.brief.md');
  assert.deepEqual(first.pending.map((row) => row.file), ['docs/plans/2026-09-03-nouvelle-entree.brief.md']);
  assert.deepEqual(first.consumed.map((row) => [row.file, row.plan, row.reason]), [
    ['docs/plans/2026-09-01-refonte-visuelle-six-pages.brief.md', 'docs/plans/2026-09-02-refonte-visuelle-six-pages.md', 'plan-exists'],
  ]);

  // Plan the second one and nothing is left to plan: briefs still on disk, `selected: null` — the
  // answer /esq:plan stops on instead of reaching back for an old brief.
  await write('2026-09-04-nouvelle-entree.md', plan('Nouvelle entree'));
  const drained = await briefPending(root);
  assert.deepEqual(drained.pending, []);
  assert.equal(drained.selected, null);
  assert.equal(drained.consumed.length, 2);

  // A plan recorded abandoned consumes nothing: `esq plan abandon` is the way back to /esq:plan.
  await write('2026-09-04-nouvelle-entree.md', `# Nouvelle entree\n\n**Abandoned:** 2026-09-05 — third corrective round refused\n\n## Phases\n\n### Phase 1 — one\n- task\n\n## Execution log\n`);
  assert.deepEqual((await briefPending(root)).pending.map((row) => row.file), ['docs/plans/2026-09-03-nouvelle-entree.brief.md']);
});

// A corrective brief is a different consumption question: /esq:plan strikes its 🟡 section rather
// than the file, leaving 🟢 for /esq:fix and 🔴 for the user, so what makes it pending is a 🟡.
test('brief pending holds a corrective brief only while it still lists a 🟡', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-cli-pending-fixes-'));
  await mkdir(path.join(root, 'docs/plans'), { recursive: true });
  const file = path.join(root, 'docs/plans/2026-09-10-alpha-fixes.brief.md');
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;

  await writeFile(file, '# Brief: alpha fixes\n\n## 🟢 Fix now\n\n- a green one\n\n## 🟡 Needs a plan\n\n- a yellow one\n');
  const open = await briefPending(root);
  assert.deepEqual(open.pending.map((row) => [row.file, row.kind, row.yellow]), [['docs/plans/2026-09-10-alpha-fixes.brief.md', 'corrective', 1]]);

  // Planned: the 🟡 section struck, the 🟢 left standing for /esq:fix — nothing here for /esq:plan.
  await writeFile(file, '# Brief: alpha fixes\n\n## 🟢 Fix now\n\n- a green one\n');
  const planned = await briefPending(root);
  assert.deepEqual(planned.pending, []);
  assert.deepEqual(planned.consumed.map((row) => [row.reason, row.plan]), [['no-yellow-left', null]]);

  // And a corrective brief whose plan is on disk is consumed by it, 🟡 or not.
  await writeFile(file, '# Brief: alpha fixes\n\n## 🟡 Needs a plan\n\n- a yellow one\n');
  await writeFile(path.join(root, 'docs/plans/2026-09-11-alpha-fixes.md'), `# Alpha fixes\n\n## Phases\n\n### Phase 1 — one\n- task\n\n## Execution log\n`);
  const consumed = await briefPending(root);
  assert.deepEqual(consumed.pending, []);
  assert.deepEqual(consumed.consumed.map((row) => [row.reason, row.plan]), [['plan-exists', 'docs/plans/2026-09-11-alpha-fixes.md']]);
});


// ── Phase 1 of every-open-item-is-ranked: the tenth column ───────────────────
// The rank is a projection the CLI owns, and the column is optional for every backlog already on
// disk. These five cover the two halves that could break an existing project: a nine-column ledger
// that keeps reading, and a first write that widens it without losing a cell.

async function rankFixture(header, ...rows) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'esq-cli-rank-'));
  await mkdir(path.join(root, 'docs'), { recursive: true });
  await writeFile(path.join(root, 'docs/BACKLOG.md'), `# Backlog\n\n${header}\n${rows.join('\n')}\n`);
  process.env.NODE_ENV = 'test';
  process.env.ESQ_TEST_GIT_ROOT = root;
  return root;
}

const NINE = '| ID | Date | Type | Pri | Summary | Source | Epic | Version | Status |\n|---|:---|---|---|---|---|---|---|---|';
const TEN = '| ID | Date | Type | Pri | Rank | Summary | Source | Epic | Version | Status |\n|---|---|---|---|---|---|---|---|---|---|';

test('the first write into a nine-column backlog adds the Rank header and pads every existing row', async () => {
  const root = await rankFixture(NINE, '| B-001 | 2026-08-17 | 🐛 bug | hi | first | manual | | | Open |');
  const file = path.join(root, 'docs/BACKLOG.md');

  const added = await addRow(root, file, { type: '☑️ todo', summary: 'second', source: 'manual', pri: 'lo' });
  const lines = (await readFile(file, 'utf8')).split('\n').filter((line) => line.startsWith('|'));
  // Header, separator and both rows are ten cells wide — nobody meets a row shorter than its header.
  assert.deepEqual(lines.map((line) => line.split('|').length - 2), [10, 10, 10, 10]);
  assert.equal(lines[0], '| ID | Date | Type | Pri | Rank | Summary | Source | Epic | Version | Status |');
  // The pre-existing row keeps every value it had, shifted right of the new blank cell.
  assert.match(lines[2], /^\| B-001 \| 2026-08-17 \| 🐛 bug \| hi \|  \| first \| manual \|/);
  assert.equal(added.row[4], '100');

  // Capture assigns only the new row's neutral tail; the legacy row stays unclassified.
  const rows = (await state(root)).backlog.rows;
  assert.deepEqual(rows.map((row) => [row.id, row.pri, row.rank]), [['B-001', 'hi', ''], ['B-002', 'lo', '100']]);
});

test('a backlog that already carries Rank round-trips the cell, and one without it reads blank', async () => {
  const wide = await rankFixture(TEN, '| B-001 | 2026-08-17 | 🐛 bug | hi | 100 | first | manual | | | Open |');
  assert.deepEqual((await state(wide)).backlog.rows.map((row) => row.rank), ['100']);
  // A second write neither widens it again nor disturbs the stored number.
  await addRow(wide, path.join(wide, 'docs/BACKLOG.md'), { type: '💡 idea', summary: 'second', source: 'manual' });
  const rows = (await state(wide)).backlog.rows;
  assert.deepEqual(rows.map((row) => [row.id, row.rank]), [['B-001', '100'], ['B-002', '200']]);
  assert.equal((await readFile(path.join(wide, 'docs/BACKLOG.md'), 'utf8')).match(/Rank/g).length, 1);

  const narrow = await rankFixture(NINE, '| B-001 | 2026-08-17 | 🐛 bug | hi | first | manual | | | Open |');
  assert.deepEqual((await state(narrow)).backlog.rows.map((row) => row.rank), ['']);
});

test('addRow derives a suggested priority from the type when the caller states none', async () => {
  const root = await rankFixture(NINE, '| B-001 | 2026-08-17 | 🐛 bug | hi | first | manual | | | Open |');
  const file = path.join(root, 'docs/BACKLOG.md');
  const pri = async (type) => (await addRow(root, file, { type, summary: 'x', source: 'build: s Phase 1' })).row[3];

  assert.equal(await pri('🐛 bug'), 'med?');
  assert.equal(await pri('⚠️ debt'), 'med?');
  assert.equal(await pri('☑️ todo'), 'med?');
  assert.equal(await pri('✨ improvement'), 'lo?');
  assert.equal(await pri('💡 idea'), 'lo?');
  // A type carrying no known glyph is still never unprioritized.
  assert.equal(priForType('something else'), 'med?');
  // A stated priority is never overwritten, suggested or confirmed.
  assert.equal((await addRow(root, file, { type: '🐛 bug', summary: 'x', source: 'manual', pri: 'hi' })).row[3], 'hi');
  assert.equal((await addRow(root, file, { type: '💡 idea', summary: 'x', source: 'manual', pri: 'hi?' })).row[3], 'hi?');
});

test('derive preserves a one-sided Rank edit and asks when both sides chose different positions', async () => {
  assert.deepEqual(derive('100', '200', '100', 'Rank'), { value: '200', rule: 'one-side-unchanged' });
  assert.match(derive('100', '200', '50', 'Rank').ask, /intended order/);
  assert.match(derive('100', '200', null, 'Rank').ask, /intended order/);
  // The same two values in any other column are still the question they always were.
  assert.equal(derive('100', '200', null, 'Summary').value, undefined);
  assert.equal(typeof derive('100', '200', null, 'Summary').ask, 'string');
  // And an unnamed column keeps derive's historical behavior exactly.
  assert.equal(typeof derive('100', '200', null).ask, 'string');
});

test('validate reports a duplicate rank and an unprioritized open row, each on its own gate', async () => {
  const narrow = await rankFixture(NINE,
    '| B-001 | 2026-08-17 | 🐛 bug | | first | manual | | | Open |',
    '| B-002 | 2026-08-17 | 🐛 bug | | second | manual | | | Open |');
  // A backlog that never adopted the column is held to neither rule — this is what keeps the tenth
  // field optional for every esquisse project on disk.
  assert.deepEqual((await validate(narrow)).findings, []);

  // And neither is one that has only *met* the column. A single row filed by build, check or review
  // widens the table long before anyone ranks the project, so gating the priority rule on the header
  // would red every open row the project already had at the moment of that one write.
  const widened = await rankFixture(TEN,
    '| B-001 | 2026-08-17 | 🐛 bug | | | first | manual | | | Open |',
    '| B-002 | 2026-08-17 | 🐛 bug | | | second | manual | | | Open |');
  assert.deepEqual((await validate(widened)).findings, []);

  const wide = await rankFixture(TEN,
    '| B-001 | 2026-08-17 | 🐛 bug | hi | 100 | first | manual | | | Open |',
    '| B-002 | 2026-08-17 | 🐛 bug | med | 100 | second | manual | | | Open |',
    '| B-003 | 2026-08-17 | 🐛 bug | | 300 | third | manual | | | Open |',
    '| B-004 | 2026-08-17 | 🐛 bug | | | fourth | manual | | | Done |');
  assert.deepEqual((await validate(wide)).findings, [
    'duplicate backlog rank 100: B-001 and B-002',
    'open backlog row with no priority: B-003',
  ]);
});


// ── Phase 2 of every-open-item-is-ranked: the two verbs that write ───────────
// `set-pri` writes the judgment, `rank` writes the explicit order (capture/reopening now supplies a
// neutral tail). What they refuse matters as much as what they write: a half-ranked ledger, a
// sequence naming an item twice, or an order the roadmap already contradicts would each be worse
// than the unranked backlog they replace.

const OPEN = (id, pri, summary = 'x') => `| ${id} | 2026-08-17 | 🐛 bug | ${pri} | ${summary} | manual | | | Open |`;

async function roadmapFixture(root, text) {
  await writeFile(path.join(root, 'docs/ROADMAP.md'), text);
  return root;
}

const ranksOf = async (file) => Object.fromEntries((await readFile(file, 'utf8')).split('\n')
  .filter((line) => /^\| B-/.test(line))
  .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
  .map((cells) => [cells[0], cells[4]]));

const prisOf = async (file) => Object.fromEntries((await readFile(file, 'utf8')).split('\n')
  .filter((line) => /^\| B-/.test(line))
  .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
  .map((cells) => [cells[0], cells[3]]));

test('set-pri writes one cell, accepts both halves of the ladder and refuses a word off it', async () => {
  const root = await rankFixture(NINE, OPEN('B-001', ''), OPEN('B-002', 'med'));
  const file = path.join(root, 'docs/BACKLOG.md');

  const suggested = await setPri(file, 'B-001', 'hi?');
  assert.deepEqual([suggested.previous, suggested.pri, suggested.confirmed], ['', 'hi?', false]);
  const confirmed = await setPri(file, 'B-001', 'hi');
  assert.deepEqual([confirmed.previous, confirmed.pri, confirmed.confirmed], ['hi?', 'hi', true]);
  // The row beside it is untouched, and the shorthand id form resolves like every other verb's.
  assert.deepEqual(await prisOf(file), { 'B-001': 'hi', 'B-002': 'med' });
  assert.equal((await setPri(file, '2', 'lo?')).id, 'B-002');

  // A value with no position on the ladder has no position in the sort either.
  await assert.rejects(setPri(file, 'B-001', 'urgent'), /invalid priority: urgent/);
  await assert.rejects(setPri(file, 'B-001', 'HI'), /invalid priority: HI/);
  await assert.rejects(setPri(file, 'B-001', ''), /invalid priority: \(empty\)/);
  await assert.rejects(setPri(file, 'B-404', 'hi'), /B-404 not found/);
  await assert.rejects(setPri(file, 'nonsense', 'hi'), /invalid backlog ID: nonsense/);
});

test('rank --order assigns the sparse sequence and widens a nine-column ledger to do it', async () => {
  const root = await rankFixture(NINE, OPEN('B-001', 'hi'), OPEN('B-002', 'lo?'), OPEN('B-003', 'med'),
    '| B-004 | 2026-08-17 | 🐛 bug | med | done | manual | | | Done |');
  const file = path.join(root, 'docs/BACKLOG.md');

  const result = await rankOrder(file, ['B-003', 'B-001', 'B-002']);
  assert.deepEqual(result.ranked, [{ id: 'B-003', rank: 100 }, { id: 'B-001', rank: 200 }, { id: 'B-002', rank: 300 }]);
  // Sparse by 100 so a later placement fits between any two neighbours, and the closed row keeps its blank.
  assert.deepEqual(await ranksOf(file), { 'B-001': '200', 'B-002': '300', 'B-003': '100', 'B-004': '' });
  assert.deepEqual((await state(root)).backlog.rows.map((row) => [row.id, row.rank]), [['B-001', '200'], ['B-002', '300'], ['B-003', '100']]);
});

test('rank --order refuses every list it cannot turn into one total order', async () => {
  const root = await rankFixture(NINE, OPEN('B-001', 'hi'), OPEN('B-002', 'lo?'), OPEN('B-003', 'med'),
    '| B-004 | 2026-08-17 | 🐛 bug | med | done | manual | | | Done |');
  const file = path.join(root, 'docs/BACKLOG.md');
  const before = await readFile(file, 'utf8');

  await assert.rejects(rankOrder(file, []), /an order naming nothing orders nothing/);
  await assert.rejects(rankOrder(file, ['B-001', 'B-001', 'B-002', 'B-003']), /B-001 appears twice in --order/);
  await assert.rejects(rankOrder(file, ['B-001', 'B-003']), /must name every open row, and 1 is missing: B-002/);
  await assert.rejects(rankOrder(file, ['B-001', 'B-002', 'B-003', 'B-404']), /B-404 matches no row/);
  await assert.rejects(rankOrder(file, ['B-001', 'B-002', 'B-003', 'B-004']), /B-004 is not open/);
  await assert.rejects(rankOrder(file, ['B-001', 'B-002', 'oops']), /invalid backlog ID: oops/);
  // Every one of them left the ledger byte-identical: a half-ranked backlog is worse than an unranked one.
  assert.equal(await readFile(file, 'utf8'), before);
});

test('rank places one item between its neighbours and writes only that cell', async () => {
  const root = await rankFixture(TEN,
    '| B-001 | 2026-08-17 | 🐛 bug | hi | 100 | first | manual | | | Open |',
    '| B-002 | 2026-08-17 | 🐛 bug | hi | 200 | second | manual | | | Open |',
    '| B-003 | 2026-08-17 | 🐛 bug | med | | third | manual | | | Open |');
  const file = path.join(root, 'docs/BACKLOG.md');

  const after = await rankPlace(file, 'B-003', { after: 'B-001' });
  assert.deepEqual([after.rank, after.renumbered, after.written], [150, false, 1]);
  assert.deepEqual(await ranksOf(file), { 'B-001': '100', 'B-002': '200', 'B-003': '150' });

  assert.equal((await rankPlace(file, 'B-003', { before: 'B-001' })).rank, 50);
  assert.equal((await rankPlace(file, 'B-003', { last: true })).rank, 300);
  assert.deepEqual(await ranksOf(file), { 'B-001': '100', 'B-002': '200', 'B-003': '300' });
});

test('an exhausted gap renumbers the sequence rather than refusing the placement', async () => {
  const root = await rankFixture(TEN,
    '| B-001 | 2026-08-17 | 🐛 bug | hi | 100 | first | manual | | | Open |',
    '| B-002 | 2026-08-17 | 🐛 bug | hi | 101 | second | manual | | | Open |',
    '| B-003 | 2026-08-17 | 🐛 bug | med | | third | manual | | | Open |');
  const file = path.join(root, 'docs/BACKLOG.md');

  const placed = await rankPlace(file, 'B-003', { after: 'B-001' });
  assert.deepEqual([placed.rank, placed.renumbered], [200, true]);
  assert.deepEqual(await ranksOf(file), { 'B-001': '100', 'B-002': '300', 'B-003': '200' });
});

test('rank refuses a placement that names nothing to place against', async () => {
  const root = await rankFixture(TEN,
    '| B-001 | 2026-08-17 | 🐛 bug | hi | 100 | first | manual | | | Open |',
    '| B-002 | 2026-08-17 | 🐛 bug | hi | | second | manual | | | Open |',
    '| B-003 | 2026-08-17 | 🐛 bug | med | | third | manual | | | Done |');
  const file = path.join(root, 'docs/BACKLOG.md');
  const before = await readFile(file, 'utf8');

  await assert.rejects(rankPlace(file, 'B-002', { after: 'B-002' }), /B-002 cannot be placed relative to itself/);
  await assert.rejects(rankPlace(file, 'B-002', {}), /exactly one of --after/);
  await assert.rejects(rankPlace(file, 'B-002', { after: 'B-001', last: true }), /exactly one of --after/);
  await assert.rejects(rankPlace(file, 'B-002', { after: 'B-404' }), /B-404 matches no row/);
  await assert.rejects(rankPlace(file, 'B-002', { after: 'B-003' }), /B-003 is not open/);
  // A row carrying no number is no position to be relative to — that is the model's call, not this file's.
  await assert.rejects(rankPlace(file, 'B-001', { after: 'B-002' }), /B-002 carries no rank yet/);
  assert.equal(await readFile(file, 'utf8'), before);
});

test('rank refuses an order contradicting a roadmap edge, and promotes only a suggested blocker', async () => {
  const root = await rankFixture(NINE, OPEN('B-001', '', 'blocker'), OPEN('B-002', 'hi', 'gated'), OPEN('B-003', 'lo', 'confirmed blocker'));
  await roadmapFixture(root, '# Roadmap\n\n## Now\n### gate\n**covers:** B-001, B-003\n**unblocks:** trim\n\n### trim\n**covers:** B-002\n**needs:** gate\n');
  const file = path.join(root, 'docs/BACKLOG.md');

  // `needs:` and `unblocks:` state the same edge from either end, so it is one pair, not two.
  const { edges } = await rankEdges(file);
  assert.deepEqual(edges, [{ before: 'gate', after: 'trim' }]);

  const before = await readFile(file, 'utf8');
  await assert.rejects(rankOrder(file, ['B-002', 'B-001', 'B-003']),
    /puts B-003 \(gate\) after B-002 \(trim\).*records gate before trim/);
  assert.equal(await readFile(file, 'utf8'), before);

  const result = await rankOrder(file, ['B-001', 'B-003', 'B-002']);
  // The unprioritized blocker is raised into the bucket it gates, and stays a suggestion.
  assert.deepEqual(result.promoted, [{ id: 'B-001', from: '', to: 'hi?', edge: 'gate → trim' }]);
  // The one the user confirmed is reported and left exactly as stated.
  assert.match(result.contradictions[0], /^B-003 is confirmed lo, below the hi it gates/);
  assert.deepEqual(await prisOf(file), { 'B-001': 'hi?', 'B-002': 'hi', 'B-003': 'lo' });
});

test('a backlog with no roadmap beside it ranks with no edges at all', async () => {
  const root = await rankFixture(NINE, OPEN('B-001', 'hi'), OPEN('B-002', 'lo?'));
  const file = path.join(root, 'docs/BACKLOG.md');
  assert.deepEqual(await rankEdges(file), { entries: new Map(), edges: [] });
  const result = await rankOrder(file, ['B-002', 'B-001']);
  assert.equal(result.promoted, undefined);
  assert.equal(result.contradictions, undefined);
  assert.deepEqual(await ranksOf(file), { 'B-001': '200', 'B-002': '100' });
});
