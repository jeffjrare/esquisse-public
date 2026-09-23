#!/usr/bin/env node
// measure-wait-cost.mjs — what an esq worker's verification moment costs, in turns and in tokens.
//
// Reads two local stores and writes nothing anywhere:
//   ~/.claude/plugins/data/*/telemetry/agent-runs.jsonl   the esq label rows (agentId -> esqCommand)
//   ~/.claude/projects/*/*/subagents/agent-<id>.jsonl     that agent's transcript
// The population is the JOIN of the two: an agent counts only when esq telemetry labelled it.
// Every other subagent on the machine is out of scope and is counted only as a context line.
//
// NOT GLOBALLY REPRODUCIBLE. The corpus is one machine's local transcript store: unversioned, not
// portable, and growing every time an agent runs. A figure is therefore only meaningful with the
// window it was taken in — pass `--through <iso>` to freeze a baseline, and `--since <iso> --through
// <iso>` to bound a post-change cohort. Without a window this prints today's moving corpus and says so.
//
// PRIVACY. This script never persists — and never prints — a prompt, a response, a command, a path,
// or any tool-result text. It reads those in memory to classify a call and emits only counts,
// durations, token totals, versions and dates.
//
// THE UNIT IS A ROUND TRIP, NOT A SECOND. One bounded shell command that waits internally is one
// round trip however long it sleeps, and may be the correct readiness primitive; three separate calls
// asking the same question are three. Wall-clock and model usage are reported on separate lines
// because they are separate facts: the check still has to run before the phase can end.
//
// Usage: node measure-wait-cost.mjs [--json] [--since <iso>] [--through <iso>]
import { readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const CLASSIFIER_VERSION = 2;

// ---------------------------------------------------------------- shapes we recognise
// A launch starts work meant to outlive the call: the harness's own background flag, or a
// hand-rolled `&`/nohup redirect into a file the agent then owns.
const HAND_ROLLED = /(^|[^&])&\s*$|\bnohup\b|\)\s*&\s*(;|$)/;
// A daemon is started to keep running. Its readiness probes are legitimate work, not waste, so it is
// counted and reported apart from the finite checks.
const DAEMON = /\b(dev|serve|preview|start|watch)\b|--watch\b|\bdocker (compose )?up\b/;
// The harness's own answer to a backgrounded call names the task and where its output goes.
const TASK_ID = /background with ID:\s*(\S+)/i;
const OUTPUT_PATH = /written to:\s*(\S+)/i;
// The harness's sentence ends in a full stop; the token must not keep it, or no later Read of that
// exact path will ever match it.
const trimToken = (token) => (token ? token.replace(/[.,;:]+$/, '') : token);
// Paths long enough to be an artifact rather than a flag.
const PATHISH = /\/[\w.\-/]{6,}/g;
// Asking "is it done yet" of something already launched.
const OBSERVE_SHAPE = /^\s*(sleep|for |while |until |grep|rg |tail|head|cat|wc|test -f|\[ -f|ls |awk|sed -n)|\bsleep\b/;
// Writing a log entry through the CLI: an invocation, not a mention. `grep append-log` is not a write.
const APPEND_LOG_CALL = /(^|[|;&]\s*|\$\(\s*|&&\s*)\s*(\S*\/)?(esq|node\s+\S*esq\S*)\s+plan\s+append-log\b/;
const APPEND_LOG_HELP = /plan\s+append-log[^|;]*--help/;
const READS_CLI_SOURCE = /esquisse\/plugin\/(lib|bin)|plugin\/lib\/cli\.mjs/;

function iso(value) { return value ? Date.parse(value) : null; }

// ---------------------------------------------------------------- the pure classifier
// `entries` is one agent's transcript, already parsed. Everything below is deterministic and has no
// filesystem access, which is what lets tests/measure fixture it without touching ~/.claude.
export function classifyTranscript(entries, options = {}) {
  const { insideEsqRepo = false, since = null, through = null } = options;
  const from = iso(since);
  const to = iso(through);
  const out = {
    turns: 0, cacheRead: 0, toolCalls: 0, versions: [],
    finiteLaunches: 0, daemonLaunches: 0, launchesWithBackgroundFlag: 0, launchesHandRolled: 0,
    observations: 0, observationSeconds: 0,
    excessStatusTurns: 0, excessStatusCacheRead: 0,
    launchesWithNoIndependentWorkFirst: 0, independentCallsBeforeFirstObservation: [],
    appendLogDiscoveryCalls: 0, appendLogDiscoveryCacheRead: 0, wroteLogEntry: false,
    notifications: 0, concludedThenNotified: false,
    firstSeen: null, lastSeen: null,
  };
  const versions = new Set();

  // One ordered pass. `stream` keeps the shape of the conversation so "the request that followed this
  // result" is answerable, which is how a poll is priced from what it actually cost.
  const stream = [];
  const calls = new Map();     // tool_use id -> call record
  const order = [];            // call records, in issue order
  let lastConclusionIndex = -1;

  for (const entry of entries) {
    const at = iso(entry.timestamp);
    if (at !== null) {
      if (from !== null && at < from) continue;
      if (to !== null && at > to) continue;
      if (out.firstSeen === null || at < out.firstSeen) out.firstSeen = at;
      if (out.lastSeen === null || at > out.lastSeen) out.lastSeen = at;
    }
    if (entry.version) versions.add(entry.version);
    const message = entry.message;
    if (!message || typeof message !== 'object') continue;
    if (message.usage) {
      out.turns += 1;
      out.cacheRead += message.usage.cache_read_input_tokens || 0;
      stream.push({ kind: 'request', cacheRead: message.usage.cache_read_input_tokens || 0 });
    }
    const content = message.content;
    if (typeof content === 'string') {
      if (content.includes('background-task event') || content.includes('<task-notification>')) {
        out.notifications += 1;
        stream.push({ kind: 'notification', index: stream.length });
        if (lastConclusionIndex >= 0) out.concludedThenNotified = true;
      }
      continue;
    }
    if (!Array.isArray(content)) continue;

    // A conclusion is an assistant turn that carries text and issues no tool call: the agent has
    // returned its result. A notification after that point resurrected a finished worker.
    if (entry.type === 'assistant') {
      const hasText = content.some((block) => block?.type === 'text' && String(block.text || '').trim().length > 0);
      const hasTool = content.some((block) => block?.type === 'tool_use');
      if (hasText && !hasTool) lastConclusionIndex = stream.length;
    }

    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      if (block.type === 'tool_use') {
        out.toolCalls += 1;
        const input = block.input || {};
        const record = {
          id: block.id,
          tool: block.name,
          command: block.name === 'Bash' ? String(input.command || '') : '',
          filePath: String(input.file_path || ''),
          background: Boolean(input.run_in_background),
          at,
          seconds: 0,
          resultText: '',
        };
        calls.set(block.id, record);
        order.push(record);
        stream.push({ kind: 'call', id: block.id });
      } else if (block.type === 'tool_result') {
        const record = calls.get(block.tool_use_id);
        const text = typeof block.content === 'string'
          ? block.content
          : Array.isArray(block.content)
            ? block.content.map((part) => (typeof part?.text === 'string' ? part.text : '')).join(' ')
            : '';
        if (text.includes('background-task event') || text.includes('<task-notification>')) {
          out.notifications += 1;
          if (lastConclusionIndex >= 0) out.concludedThenNotified = true;
        }
        if (record) {
          record.resultText = text;
          if (at !== null && record.at !== null) record.seconds = (at - record.at) / 1000;
        }
      }
    }
  }
  out.versions = [...versions].sort();

  // ---- second pass: launches are tracked individually, never as "the most recent one".
  const launches = [];   // {taskId, ownedPaths:Set, daemon, observations:[], independentBefore, closed}
  const ownedIndex = new Map(); // path or task id -> launch

  const claim = (launch, token) => {
    if (!token) return;
    launch.ownedPaths.add(token);
    ownedIndex.set(token, launch);
  };

  for (const record of order) {
    if (record.tool === 'Bash') {
      const isLaunch = record.background || HAND_ROLLED.test(record.command);
      if (isLaunch) {
        const launch = {
          ownedPaths: new Set(),
          daemon: DAEMON.test(record.command),
          observations: [],
          independentBefore: 0,
          background: record.background,
        };
        launches.push(launch);
        if (record.background) out.launchesWithBackgroundFlag += 1; else out.launchesHandRolled += 1;
        if (launch.daemon) out.daemonLaunches += 1; else out.finiteLaunches += 1;
        claim(launch, trimToken((TASK_ID.exec(record.resultText) || [])[1]));
        claim(launch, trimToken((OUTPUT_PATH.exec(record.resultText) || [])[1]));
        for (const found of record.command.match(PATHISH) || []) claim(launch, found);
        continue;
      }
    }

    // Discovery of the ledger CLI's interface. `--help` on that subcommand is unambiguous anywhere;
    // reading the CLI's source counts only OUTSIDE the esquisse checkout, where it cannot be the
    // agent's own implementation work.
    const surface = record.tool === 'Bash' ? record.command : record.filePath;
    const askedForHelp = record.tool === 'Bash' && APPEND_LOG_HELP.test(record.command);
    if (askedForHelp || (READS_CLI_SOURCE.test(surface) && !insideEsqRepo)) {
      out.appendLogDiscoveryCalls += 1;
      record.isDiscovery = true;
    }
    if (record.tool === 'Bash' && APPEND_LOG_CALL.test(record.command) && !askedForHelp) out.wroteLogEntry = true;

    // Is this call an observation of a launch that is still open? A Bash call must both mention one
    // of that launch's owned tokens and have the shape of a status check; a Read of the launch's own
    // output path is an observation whatever else it looks like — the harness's background result
    // names Read as the way to look.
    let observed = null;
    if (record.tool === 'Read') {
      observed = ownedIndex.get(record.filePath) || null;
    } else if (record.tool === 'Bash') {
      for (const [token, launch] of ownedIndex) {
        if (record.command.includes(token) && OBSERVE_SHAPE.test(record.command)) { observed = launch; break; }
      }
    }
    if (observed) {
      observed.observations.push(record);
      out.observations += 1;
      out.observationSeconds += record.seconds;
      if (observed.observations.length === 1) {
        out.independentCallsBeforeFirstObservation.push(observed.independentBefore);
        if (observed.independentBefore === 0) out.launchesWithNoIndependentWorkFirst += 1;
      }
      continue;
    }
    // Anything else, of any tool, is independent work for every launch still waiting on its first
    // observation. Assistant-only drafting is deliberately NOT counted: it issues no call, so it
    // cannot be told apart from the model thinking before a poll.
    for (const launch of launches) if (launch.observations.length === 0) launch.independentBefore += 1;
  }

  // ---- excess status turns. COUNTERFACTUAL, and named as one.
  // For a finite check observed N times, the counterfactual "the worker waited once and read the
  // result" keeps the LAST observation — the one that consumed the result — and removes the N-1
  // before it. Daemons are excluded: a readiness probe on a server it just started is work, not waste.
  const priced = new Map();
  for (let i = 0; i < stream.length; i += 1) {
    if (stream[i].kind !== 'call') continue;
    for (let j = i + 1; j < stream.length; j += 1) {
      if (stream[j].kind === 'request') { priced.set(stream[i].id, stream[j].cacheRead); break; }
    }
  }
  for (const launch of launches) {
    if (launch.daemon) continue;
    const excess = launch.observations.slice(0, -1);
    out.excessStatusTurns += excess.length;
    for (const record of excess) out.excessStatusCacheRead += priced.get(record.id) || 0;
  }
  for (const record of order) {
    if (record.isDiscovery) out.appendLogDiscoveryCacheRead += priced.get(record.id) || 0;
  }
  return out;
}

// ---------------------------------------------------------------- local stores
async function labelledAgents(window) {
  const root = path.join(os.homedir(), '.claude/plugins/data');
  const labels = new Map();
  let dirs = [];
  try { dirs = await readdir(root); } catch { return labels; }
  for (const dir of dirs) {
    let text;
    try { text = await readFile(path.join(root, dir, 'telemetry/agent-runs.jsonl'), 'utf8'); } catch { continue; }
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      let row; try { row = JSON.parse(line); } catch { continue; }
      if (row.source !== 'AgentLabel' || !row.agentId || !row.esqCommand) continue;
      const at = iso(row.recordedAt);
      if (at !== null && window.from !== null && at < window.from) continue;
      if (at !== null && window.to !== null && at > window.to) continue;
      labels.set(row.agentId, row.esqCommand);
    }
  }
  return labels;
}

async function transcripts() {
  const root = path.join(os.homedir(), '.claude/projects');
  const found = new Map();
  let projects = [];
  try { projects = await readdir(root, { withFileTypes: true }); } catch { return found; }
  for (const project of projects) {
    if (!project.isDirectory()) continue;
    let sessions = [];
    try { sessions = await readdir(path.join(root, project.name), { withFileTypes: true }); } catch { continue; }
    for (const session of sessions) {
      if (!session.isDirectory()) continue;
      const dir = path.join(root, project.name, session.name, 'subagents');
      let files = [];
      try { files = await readdir(dir); } catch { continue; }
      for (const file of files) {
        const match = /^agent-([0-9a-f]+)\.jsonl$/.exec(file);
        if (match) found.set(match[1], path.join(dir, file));
      }
    }
  }
  return found;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarize(agentsByCommand, context) {
  const eligible = [...(agentsByCommand.build || []), ...(agentsByCommand.fix || []), ...(agentsByCommand.work || [])];
  const sum = (key) => eligible.reduce((total, agent) => total + (agent[key] || 0), 0);
  const wrote = eligible.filter((agent) => agent.wroteLogEntry);
  return {
    classifierVersion: CLASSIFIER_VERSION,
    window: { since: context.since || null, through: context.through || null, open: !context.through },
    measuredAt: context.through || new Date().toISOString(),
    transcriptsOnDisk: context.transcriptsOnDisk,
    labelledByEsq: context.labelledByEsq,
    outOfScope: context.outOfScope,
    eligible: {
      command: 'build+fix+work',
      agents: eligible.length,
      versions: [...new Set(eligible.flatMap((agent) => agent.versions))].sort(),
      turns: sum('turns'),
      cacheReadTokens: sum('cacheRead'),
      finiteLaunches: sum('finiteLaunches'),
      daemonLaunches: sum('daemonLaunches'),
      launchesWithBackgroundFlag: sum('launchesWithBackgroundFlag'),
      launchesHandRolled: sum('launchesHandRolled'),
      observations: sum('observations'),
      observationSeconds: Math.round(sum('observationSeconds')),
      launchesWithNoIndependentWorkFirst: sum('launchesWithNoIndependentWorkFirst'),
      medianIndependentCallsBeforeFirstObservation: median(eligible.flatMap((agent) => agent.independentCallsBeforeFirstObservation)),
      excessStatusTurns: sum('excessStatusTurns'),
      excessStatusCacheReadTokens: sum('excessStatusCacheRead'),
      agentsWithExcessStatusTurns: eligible.filter((agent) => agent.excessStatusTurns > 0).length,
      notifications: sum('notifications'),
      agentsNotifiedAfterConcluding: eligible.filter((agent) => agent.concludedThenNotified).length,
    },
    appendLogDiscovery: {
      denominator: wrote.length,
      numerator: wrote.filter((agent) => agent.appendLogDiscoveryCalls > 0).length,
      calls: wrote.reduce((total, agent) => total + agent.appendLogDiscoveryCalls, 0),
      medianCallsPerAffectedAgent: median(wrote.filter((agent) => agent.appendLogDiscoveryCalls > 0).map((agent) => agent.appendLogDiscoveryCalls)),
      cacheReadTokens: wrote.reduce((total, agent) => total + agent.appendLogDiscoveryCacheRead, 0),
    },
    perCommand: Object.fromEntries(Object.entries(agentsByCommand).map(([command, agents]) => [command, {
      agents: agents.length,
      excessStatusTurns: agents.reduce((total, agent) => total + agent.excessStatusTurns, 0),
      appendLogDiscoveryCalls: agents.reduce((total, agent) => total + agent.appendLogDiscoveryCalls, 0),
    }])),
  };
}

function render(summary) {
  const e = summary.eligible;
  const d = summary.appendLogDiscovery;
  const window = summary.window.open
    ? `open-ended — a MOVING corpus; pass --through <iso> to freeze it`
    : `${summary.window.since || 'start'} … ${summary.window.through}`;
  const lines = [
    `window      ${window}`,
    `            classifier v${summary.classifierVersion} · Claude Code ${e.versions.join(', ') || 'unknown'}`,
    `population  ${e.agents} esq ${e.command} agents (of ${summary.labelledByEsq} labelled, ${summary.transcriptsOnDisk} transcripts on disk)`,
    `            ${e.turns} turns · ${(e.cacheReadTokens / 1e6).toFixed(1)} M cache-read tokens`,
    `launches    ${e.finiteLaunches} finite + ${e.daemonLaunches} daemon (${e.launchesWithBackgroundFlag} background flag, ${e.launchesHandRolled} hand-rolled)`,
    `            ${e.launchesWithNoIndependentWorkFirst} observed with no independent call first · median ${e.medianIndependentCallsBeforeFirstObservation} independent calls before the first observation`,
    `observation ${e.observations} calls, ${(e.observationSeconds / 60).toFixed(0)} min of wall-clock (NOT a saving — the check still has to run)`,
    `excess      ${e.excessStatusTurns} status turns on finite checks, in ${e.agentsWithExcessStatusTurns}/${e.agents} agents`,
    `            ${(e.excessStatusCacheReadTokens / 1e6).toFixed(2)} M cache-read — COUNTERFACTUAL: the last observation of each check is kept as the result read`,
    `notify      ${e.notifications} background-task notifications · ${e.agentsNotifiedAfterConcluding} agents notified after concluding`,
    `append-log  ${d.numerator}/${d.denominator} agents that wrote an entry rediscovered the schema · ${d.calls} calls · median ${d.medianCallsPerAffectedAgent}/agent · ${(d.cacheReadTokens / 1e6).toFixed(2)} M cache-read`,
  ];
  return `${lines.join('\n')}\n`;
}

async function main(argv) {
  const asJson = argv.includes('--json');
  const at = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
  const since = at('--since');
  const through = at('--through');
  for (const [flag, value] of [['--since', since], ['--through', through]]) {
    if (value !== null && Number.isNaN(Date.parse(value))) {
      process.stderr.write(`${flag} is not an ISO timestamp: ${value}\n`);
      process.exitCode = 2;
      return;
    }
  }
  const window = { from: iso(since), to: iso(through) };
  const labels = await labelledAgents(window);
  const files = await transcripts();
  const byCommand = { build: [], fix: [], work: [], check: [], review: [], other: [] };
  let outOfScope = 0;
  for (const [agentId, file] of files) {
    const command = labels.get(agentId);
    if (!command) { outOfScope += 1; continue; }
    const entries = [];
    for (const line of (await readFile(file, 'utf8')).split('\n')) {
      if (!line.trim()) continue;
      try { entries.push(JSON.parse(line)); } catch { /* a truncated tail is not a measurement */ }
    }
    const cwd = entries.find((entry) => entry.cwd)?.cwd || '';
    const insideEsqRepo = /\/esquisse(\.worktrees)?(\/|$)/.test(cwd);
    const classified = classifyTranscript(entries, { insideEsqRepo, since, through });
    if (classified.turns === 0) continue;   // entirely outside the window
    const bucket = byCommand[command] ? command : 'other';
    byCommand[bucket].push(classified);
  }
  const summary = summarize(byCommand, {
    since, through, transcriptsOnDisk: files.size, labelledByEsq: labels.size, outOfScope,
  });
  process.stdout.write(asJson ? `${JSON.stringify(summary, null, 2)}\n` : render(summary));
}

if (import.meta.url === `file://${process.argv[1]}`) await main(process.argv.slice(2));
