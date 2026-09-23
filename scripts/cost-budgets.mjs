#!/usr/bin/env node
// cost-budgets.mjs — is today's telemetry still inside the regression budgets
// the README states?
//
// `README.md § Model recommendations` carries a dated "Measured cost per
// command" table whose subagent rows each hold a budget cell on the two figures
// `esq telemetry summary --json` can re-derive: median output tokens and median
// duration (`43.5k / 10m45s · n=33 · 2026-08-19`). This reads that column —
// the README table is the single source, so the doc and the checker cannot
// drift — and compares it against the live summary, one line per group.
//
//   node scripts/cost-budgets.mjs                          # live store
//   node scripts/cost-budgets.mjs --summary <file.json>    # replay a saved summary
//   node scripts/cost-budgets.mjs --readme <file.md>       # a table other than this repo's
//
// Exit 0 every compared group is inside its budget, 1 a breach (or a table that
// cannot be parsed, naming the offending line), 2 nothing to check — no budget
// row could be compared against a sample, which an empty store is.
//
// Sibling to probe-model-pins.mjs and, like it, never wired into audit.sh: it
// reads one machine's telemetry store, so a cost regression here would redden a
// commit that did not cause it. A breach is an investigation, not a failure.
//
// Dependency-free; node built-ins only.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SECTION = '### Measured cost per command';
const TABLE = '**Subagent runs**';

// A malformed table is a finding with a line to look at, never a silent skip.
export class TableError extends Error {
  constructor(message, line) { super(message); this.line = line; }
}

const CELL = /^(?<tok>[0-9]+(?:\.[0-9]+)?)k\s*\/\s*(?<dur>[0-9hms]+)\s*·\s*n=(?<n>[0-9]+)\s*·\s*(?<date>\d{4}-\d{2}-\d{2})$/;
const DURATION = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;

// `10m45s`, `1h02m`, `45s` → ms. Null when it is not a duration at all.
export function parseDuration(text) {
  const m = DURATION.exec(text);
  if (!m || !m[0] || (!m[1] && !m[2] && !m[3])) return null;
  return ((+(m[1] || 0) * 60 + +(m[2] || 0)) * 60 + +(m[3] || 0)) * 1000;
}

// The summary keys its groups `esq:<command>`; the README writes the slash
// command (`/esq:build`) and marks one row that is not a slash command with a
// footnote dagger. Parse on the backticked token, never on the whole cell.
export function commandKey(cell) {
  const m = /`([^`]+)`/.exec(cell);
  if (!m) return null;
  const token = m[1].trim().replace(/^\//, '');
  return /^esq:[a-z-]+$/.test(token) ? token : null;
}

export function parseBudgets(readme) {
  const lines = readme.split('\n');
  const start = lines.findIndex((l) => l.startsWith(SECTION));
  if (start < 0) throw new TableError(`no "${SECTION}" section`, null);
  const end = lines.findIndex((l, i) => i > start && l.startsWith('### '));
  const stop = end < 0 ? lines.length : end;
  const head = lines.findIndex((l, i) => i > start && i < stop && l.startsWith(TABLE));
  if (head < 0) throw new TableError(`no "${TABLE}" table under "${SECTION}"`, null);

  const rows = [];
  let columns = null;
  let budgetAt = -1;
  for (let i = head; i < stop; i++) {
    const line = lines[i];
    if (!line.startsWith('|')) { if (rows.length) break; continue; }
    if (/^\|[\s-]+\|/.test(line) && line.includes('---')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (!columns) {
      columns = cells;
      budgetAt = cells.findIndex((c) => c.toLowerCase().startsWith('budget'));
      if (budgetAt < 0) throw new TableError('the subagent table has no Budget column', line);
      continue;
    }
    if (cells.length !== columns.length) {
      throw new TableError(`row has ${cells.length} cells, the header has ${columns.length}`, line);
    }
    const command = commandKey(cells[0]);
    if (!command) throw new TableError('first cell carries no `esq:<command>` token', line);
    const cell = cells[budgetAt];
    if (cell === '—' || cell === '-' || cell === '') { rows.push({ command, budget: null, line }); continue; }
    const m = CELL.exec(cell);
    if (!m) throw new TableError(`budget cell is not "<n>k / <duration> · n=<runs> · <date>": "${cell}"`, line);
    const durationMs = parseDuration(m.groups.dur);
    if (durationMs === null) throw new TableError(`budget cell has no readable duration: "${cell}"`, line);
    rows.push({
      command,
      budget: {
        outputTokens: Math.round(parseFloat(m.groups.tok) * 1000),
        durationMs,
        runs: +m.groups.n,
        date: m.groups.date,
      },
      line,
    });
  }
  if (!columns) throw new TableError(`no table rows under "${TABLE}"`, null);
  return rows;
}

// One verdict per budgeted group. A group the summary cannot speak to — absent,
// no token sample, or back below the confirmed threshold — is skipped with its
// reason, never counted as ok and never as a breach: a provisional median is a
// figure, not evidence, which is the same rule the README table states.
export function compare(rows, summary) {
  const groups = (summary && summary.byCommand) || {};
  return rows.filter((r) => r.budget).map((row) => {
    const g = groups[row.command];
    if (!g || !g.runs) return { ...row, state: 'skip', why: 'no run in this window' };
    if (!g.tokens || typeof g.tokens.medianOutput !== 'number') {
      return { ...row, state: 'skip', why: `${g.runs} run${g.runs === 1 ? '' : 's'}, none with tokens` };
    }
    if (g.provisional) return { ...row, state: 'skip', why: `provisional again — ${g.runs} runs` };
    const measured = { outputTokens: g.tokens.medianOutput, durationMs: g.durationMs && g.durationMs.median, runs: g.runs };
    const over = [];
    if (measured.outputTokens > row.budget.outputTokens) {
      over.push(`out ${fmtTok(measured.outputTokens)} > ${fmtTok(row.budget.outputTokens)}`);
    }
    if (typeof measured.durationMs === 'number' && measured.durationMs > row.budget.durationMs) {
      over.push(`duration ${fmtDur(measured.durationMs)} > ${fmtDur(row.budget.durationMs)}`);
    }
    return { ...row, state: over.length ? 'breach' : 'ok', measured, over };
  });
}

export function fmtTok(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

export function fmtDur(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m`;
}

export function render(results, summary) {
  const out = [];
  const runs = summary && typeof summary.runs === 'number' ? summary.runs : '?';
  const window = (summary && summary.window && summary.window.first)
    ? `${String(summary.window.first).slice(0, 10)} → ${String(summary.window.last).slice(0, 10)}`
    : 'no window';
  out.push(`cost-budgets — ${results.length} budgeted group${results.length === 1 ? '' : 's'} · ${runs} recorded runs · ${window}`);
  for (const r of results) {
    if (r.state === 'skip') { out.push(`  –  ${r.command} — not compared: ${r.why}`); continue; }
    const m = `out ${fmtTok(r.measured.outputTokens)} / ${typeof r.measured.durationMs === 'number' ? fmtDur(r.measured.durationMs) : '?'} over ${r.measured.runs} runs`;
    if (r.state === 'ok') { out.push(`  ok ${r.command} — ${m}, budget ${fmtTok(r.budget.outputTokens)} / ${fmtDur(r.budget.durationMs)} (n=${r.budget.runs}, ${r.budget.date})`); continue; }
    out.push(`  BREACH ${r.command} — ${r.over.join('; ')} — ${m}, budget set from n=${r.budget.runs} on ${r.budget.date}`);
  }
  const breached = results.filter((r) => r.state === 'breach');
  const compared = results.filter((r) => r.state !== 'skip');
  if (breached.length) {
    out.push(`${breached.length} of ${compared.length} compared group${compared.length === 1 ? '' : 's'} over budget: ${breached.map((r) => r.command).join(', ')}. A breach is an investigation, not a failure — a regression, a fatter plan, or a fair price for new work.`);
  } else if (compared.length) {
    out.push(`All ${compared.length} compared group${compared.length === 1 ? '' : 's'} inside budget.`);
  }
  return out.join('\n');
}

export function liveSummary(root = ROOT) {
  const res = spawnSync(process.execPath, [resolve(root, 'plugin', 'bin', 'esq'), 'telemetry', 'summary', '--json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (res.error) throw new Error(`could not run esq telemetry summary: ${res.error.message}`);
  if (res.status !== 0) throw new Error(`esq telemetry summary --json exited ${res.status}: ${(res.stderr || '').trim()}`);
  try { return JSON.parse(res.stdout); } catch { throw new Error('esq telemetry summary --json did not print JSON'); }
}

function arg(argv, flag) {
  const i = argv.indexOf(flag);
  if (i < 0) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) { console.error(`${flag} needs a file`); process.exit(2); }
  return v;
}

export function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('usage: cost-budgets.mjs [--summary <summary.json>] [--readme <README.md>]\n  compares the README\'s budget column against esq telemetry summary --json\n  exit 0 inside budget · 1 breach or unparsable table · 2 nothing to check');
    return 0;
  }
  const readmePath = arg(argv, '--readme') || resolve(ROOT, 'README.md');
  const summaryPath = arg(argv, '--summary');

  let rows;
  try {
    rows = parseBudgets(readFileSync(readmePath, 'utf8'));
  } catch (err) {
    if (err instanceof TableError) {
      console.error(`cost-budgets: ${readmePath}: ${err.message}`);
      if (err.line) console.error(`  offending line: ${err.line}`);
      return 1;
    }
    console.error(`cost-budgets: ${err.message}`);
    return 2;
  }

  const budgeted = rows.filter((r) => r.budget);
  if (!budgeted.length) {
    console.error('cost-budgets: the table carries no budget cell — nothing to check');
    return 2;
  }

  let summary;
  try {
    summary = summaryPath ? JSON.parse(readFileSync(summaryPath, 'utf8')) : liveSummary();
  } catch (err) {
    console.error(`cost-budgets: ${err.message}`);
    return 2;
  }

  const results = compare(rows, summary);
  console.log(render(results, summary));
  if (results.some((r) => r.state === 'breach')) return 1;
  if (!results.some((r) => r.state !== 'skip')) {
    console.error('cost-budgets: no budgeted group had a confirmed sample — nothing to check');
    return 2;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
