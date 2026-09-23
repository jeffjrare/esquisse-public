#!/usr/bin/env node
// measure-rereads.mjs — how often an esq run re-accessed a path it had already accessed.
//
// Reads two local stores and writes nothing anywhere:
//   ~/.claude/plugins/data/*/telemetry/agent-runs.jsonl   the esq label rows (agentId -> esqCommand)
//   ~/.claude/projects/*/*/subagents/agent-<id>.jsonl     that agent's transcript
// The population is the JOIN of the two: an agent counts only when esq telemetry labelled it.
//
// WHAT THIS ANSWERS, AND WHAT IT REFUSES TO ANSWER. B-070 says an esq agent re-reads files it has
// already read and pays a round trip for each. This counts those accesses. It does NOT decide
// whether B-070 may close, it declares no threshold, and it converts no count into seconds or
// tokens saved — a repeated call is not a removable round trip, and the report keeps the two apart.
//
// NOT GLOBALLY REPRODUCIBLE. The corpus is one machine's local transcript store: unversioned, not
// portable, and growing every time an agent runs. Pass `--through <iso>` to freeze a reading.
//
// PRIVACY, AND IT IS THE REASON THIS FILE EXISTS RATHER THAN A COUNTER IN measure-wait-cost.mjs.
// That script promises, for the whole file, never to print a path. This one must print paths to be
// worth anything, so its boundary is narrower and stated per emission: a path leaves the process
// ONLY when that path itself resolves — through realpath, after resolution against the run's own
// cwd — inside this repository, and it leaves repository-relative. An absolute path elsewhere, a
// `../` escape and a symlink out are counted and never named, in the text render and in `--json`
// alike. Prompt text, response text, tool-result text and command strings never leave: they are read
// in memory to recognize a write, extract a path operand or test the read-once needle, and what is
// emitted is a published path, a boolean, or a count.
//
// Usage: node measure-rereads.mjs [--json] [--since <iso>] [--through <iso>]
//
// Sibling to cost-budgets.mjs, measure-wait-cost.mjs and outcome-join.mjs, and like them never
// wired into audit.sh: it reads one machine's state, so a reading here would redden a commit that
// did not cause it. Its fixture-only suite in tests/measure/ IS gated, by check 39.
//
// Dependency-free; node built-ins only.

import { readFile, readdir } from 'node:fs/promises';
import { existsSync, realpathSync as fsRealpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ---------------------------------------------------------------- pinned constants
// Bumping CLASSIFIER_VERSION is how a reading says it is not comparable with an older one. Edit the
// needle or the anchor below and you MUST bump it: both are quoted from surfaces that can change,
// and a silently re-partitioned corpus is worse than no reading at all.
//
// v2 (2026-09-11) — five corrections, each of which had been producing false redundancy:
//   * a shell read carries its operation and its range, so `head -n 5 f` and `cat f` are not the
//     same access, and `wc` establishes no content at all;
//   * a Bash call counts toward the removable-turn bound only when EVERY segment of it is a
//     recognized read — `cat f && npm test` does real work;
//   * a search's identity includes every option that changes what it returns, and any write
//     invalidates search history rather than only the one path key it named;
//   * a path is published only when realpath verifies its containment, never lexically;
//   * join coverage is computed over the whole store and is independent of the window.
//
// v3 (2026-09-11) — redundancy is proven from what a call DELIVERED, never inferred from what it
// asked for. Every access carries the range `toolUseResult.file` recorded; a range contained in a
// prior confirmed delivery is established redundancy, one reaching lines the prior never delivered
// is `broaderAccess`, and anything the results do not settle is `overlapUnknown` and UNRESOLVED —
// where v2 published all of it as `differentSlice`, a legitimate outcome counted as resolved. A
// source whose stdout goes to a file is no longer a content access at all.
export const CLASSIFIER_VERSION = 3;

// The sentence the `shared:read-once` block opens with, as it stands in the five worker skills.
export const READ_ONCE_NEEDLE = 'Read each file once.';

// The line the harness writes when it delivers a skill body into a run. Observed on 686 of 981
// transcripts in this machine's store on 2026-09-11.
export const SKILL_DELIVERY_ANCHOR = 'Base directory for this skill:';

// The five worker skills that carry the shared block. A delivery record naming any other skill
// proves nothing about the rule, which is why its absence there is `ruleNotCarried` and never
// `ruleAbsent`.
export const BLOCK_CARRYING_SKILLS = new Set(['build', 'check', 'fix', 'review', 'work']);

const SKILL_NAME = /plugin\/skills\/([a-z0-9-]+)/;

// ---------------------------------------------------------------- bounded recognizers
// Every regex below is a closed list. Nothing here is a shell parser, and nothing here guesses:
// what a recognizer cannot resolve becomes an `unresolved` class in the report rather than a
// silent assumption in either direction.

// The harness's own notice that it did not hand over the whole result. Deliberately narrow: a
// false positive here moves a genuine repeat into `afterTruncation` and understates redundancy.
const TRUNCATION = /(output (?:was )?truncated|truncated to|\[truncated\]|results? (?:were )?truncated|(?:file )?contents? truncated|truncated because)/i;

// A mutation that rewrites the working tree wholesale. After one, no path's history is trustworthy.
const MASS_MUTATION = /(?:^|[;&|]\s*)(?:git\s+(?:checkout|restore|switch|stash|merge|revert|apply|reset)\b|patch\b)/;

// A command that may write anywhere the recognizer cannot follow: an interpreter reading its
// program from a heredoc or from `-e`/`-c`. Paths mentioned in such a command are marked unresolved.
const UNRECOGNIZED_WRITE = /<<[-]?\s*['"]?[A-Za-z_]\w*|(?:python3?|node|perl|ruby|bash|sh)\s+(?:-\S*\s+)*(?:-e|-c|-)\s/;

// A command is compound when a failure can follow work that already happened.
const COMPOUND = /(&&|\|\||;|\|)/;

// Recognized shell writes. The target is one operand, taken positionally.
const REDIRECT = /(?:^|[^0-9>&])>>?\s*(?:"([^"]+)"|'([^']+)'|([^\s;&|<>]+))/g;
const TEE = /\btee\s+(?:-a\s+)?(?:"([^"]+)"|'([^']+)'|([^\s;&|<>]+))/g;
const SED_IN_PLACE = /\bsed\s+(?:-[a-zA-Z]*i[a-zA-Z]*|--in-place)\b/;
const COPY_MOVE = /\b(?:cp|mv)\s+(?:-\S+\s+)*(\S+)\s+(\S+)/g;

// Recognized `esq` CLI writes, with the target taken from the invocation itself.
const ESQ_PLAN_WRITE = /\besq\s+plan\s+(?:append-log|set-reviewed|resolve-block|abandon)\s+(\S+)/g;
const ESQ_MERGE_LAND = /\besq\s+merge\s+land\s+--plan\s+(\S+)/g;
const ESQ_BACKLOG_WRITE = /\besq\s+backlog\s+(?:add|set-status|reserve-id|reserve-block)\b/;
const ESQ_MERGE_SEAL = /\besq\s+merge\s+seal\b/;
const BACKLOG_FILE = 'docs/BACKLOG.md';
const DECISIONS_FILE = 'docs/DECISIONS.md';

// Recognized shell reads, and what each one establishes. `whole` means the verb with no arguments
// delivers the entire file, so it shares a slice with a whole-file `Read`; `confirms` means the
// call establishes the content of the slice it names. `wc` confirms nothing — it returns a count,
// never the bytes — so a later access to that path is unresolved rather than redundant.
const SHELL_READ_VERBS = {
  cat: { whole: true, confirms: true },
  less: { whole: true, confirms: true },
  more: { whole: true, confirms: true },
  head: { whole: false, confirms: true },
  tail: { whole: false, confirms: true },
  nl: { whole: false, confirms: true },
  od: { whole: false, confirms: true },
  wc: { whole: false, confirms: false },
  sed: { whole: false, confirms: true },     // only ever a read with -n
};
const SHELL_SEARCH_VERBS = new Set(['grep', 'rg', 'egrep', 'fgrep']);

// A command is split into segments on these and nowhere else. A pipeline, a redirection, a
// background `&`, a subshell or a command substitution makes the call unaccountable, which is a
// separate fact from what it read.
const SEGMENT_SPLIT = /&&|\|\||;|\n/;
const UNACCOUNTABLE = /[|<>&]|\$\(|`/;

// Stdout sent somewhere the agent never reads: `> f`, `>> f`, `1> f`. The bytes leave the process
// and no content is delivered, so the source is not a content access at all — no history seeded, no
// denominator entry. `2>`, `2>&1` and `>&2` are NOT this: stderr is still captured and shown, and a
// digit or an `&` beside the operator is what tells them apart.
const STDOUT_TO_FILE = /(?:^|[^0-9>&])1?>>?\s*(?![&>])\S/;
// Any redirection and its target, so the target is never mistaken for something the command READ.
// `cat f 2> /tmp/err` reads f and writes /tmp/err; without this the error log counted as a read.
const REDIRECT_CLAUSE = /\d?>>?\s*(?:&\d|\S+)/g;

// A token that is worth treating as a path: it has a separator, or a known extension.
const EXTENSIONS = 'md|mjs|cjs|js|jsx|ts|tsx|json|jsonl|sh|bash|py|txt|yml|yaml|toml|lock|css|html';
const PATHISH = new RegExp(`^[~.\\w/@-]*\\/[\\w.@+-][\\w./@+-]*$|^[\\w.@+-]+\\.(?:${EXTENSIONS})$`);
const PATH_SUBSTRING = new RegExp(`[~.\\w@+-]*\\/[\\w.@+-][\\w./@+-]*|[\\w.@+-]+\\.(?:${EXTENSIONS})\\b`, 'g');

const READ_TOOLS = new Set(['Read', 'NotebookRead']);
const SEARCH_TOOLS = new Set(['Grep', 'Glob']);
const WRITE_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit', 'MultiEdit']);

// The separator inside a composite history key. A path cannot contain it in any shape this reads.
const SEP = '\u0001';

// Every class a repeated access can land in, grouped. The groups are never summed into one rate:
// `redundant` is the only claim of established waste, `legitimate` is resolved and fine, and
// `unresolved` is what the bounded recognizers could not settle.
export const CLASS_GROUPS = {
  redundant: ['identical'],
  legitimate: ['broaderAccess', 'afterTruncation'],
  unresolved: [
    'overlapUnknown', 'afterUnrecognizedWrite', 'afterUncertainWrite',
    'afterUnconfirmedRead', 'historyIncomplete',
  ],
};
export const ALL_CLASSES = [
  ...CLASS_GROUPS.redundant, ...CLASS_GROUPS.legitimate, ...CLASS_GROUPS.unresolved,
];

// ---------------------------------------------------------------- small helpers
function iso(value) { return value ? Date.parse(value) : null; }

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part?.text === 'string' ? part.text : '')).join(' ');
  }
  return '';
}

function unquote(token) { return String(token).replace(/^["']|["']$/g, ''); }

// Path-like candidates in a command fragment: whitespace-separated operands, plus the contents of
// any quoted string. The second half is what finds a path inside an interpreter's own program
// (`open("docs/a.md")`) without parsing the interpreter's language.
function pathOperands(segment) {
  const text = String(segment || '');
  const candidates = text.split(/\s+/).filter(Boolean).filter((t) => !t.startsWith('-')).map(unquote);
  // A whole-token scan is not enough: an interpreter's own program arrives as ONE quoted token
  // (`node -e 'require("docs/z.json")'`), so path-shaped substrings are scanned for as well. This
  // over-collects rather than under-collects on purpose — what it finds becomes an *unresolved*
  // class or a shell read, never an assertion that work was redundant.
  for (const match of text.matchAll(PATH_SUBSTRING)) candidates.push(match[0]);
  return [...new Set(candidates.filter((t) => !t.startsWith('-') && PATHISH.test(t)))];
}

function collect(regex, command, pick) {
  const out = [];
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(command)) !== null) {
    const groups = match.slice(1).filter((g) => g !== undefined);
    const value = pick === 'last' ? groups[groups.length - 1] : groups[pick - 1];
    if (value) out.push(unquote(value));
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return out;
}

// One segment of a command, if and only if it is a recognized read. Returns null otherwise — which
// is what makes the whole call unaccountable, and is deliberately the common answer.
function recognizeReadSegment(segment) {
  const argv = String(segment).trim().split(/\s+/).filter(Boolean);
  if (!argv.length) return { empty: true };
  const verb = argv[0].replace(/^.*\//, '');
  // Redirection is never an operand: it is not a path the command read, and it is not an argument
  // that changes what it delivered. `cat f 2>&1` is the same whole-file delivery as `cat f`.
  const rest = argv.slice(1).join(' ').replace(REDIRECT_CLAUSE, ' ').split(/\s+/).filter(Boolean);
  const paths = pathOperands(rest.join(' '));
  if (!paths.length) return null;                       // reads stdin, or names nothing we track
  const args = rest.filter((t) => !paths.includes(unquote(t))).map(unquote);

  if (SHELL_SEARCH_VERBS.has(verb) && !STDOUT_TO_FILE.test(segment)) {
    // A search over a file returns matching lines, never the file. Its identity is the whole
    // invocation, so changing an option that changes the answer changes the access.
    const options = args.slice(1).sort().join(' ');     // args[0] is the pattern
    return { searches: paths.map((path) => ({ path, options: `${verb} ${options}`, pattern: args[0] ?? '' })) };
  }

  const verbSpec = SHELL_READ_VERBS[verb];
  if (!verbSpec) return null;
  if (verb === 'sed' && !args.includes('-n')) return null;   // `sed -i`/`sed s///` is not a read
  // `cat SRC > DST` reads SRC and shows the agent nothing. Counting it as a delivery seeded a
  // confirmed history the agent never earned and inflated the content-access denominator; 118
  // occurrences in local esq:build runs. Anything the recognizer cannot place goes the same way —
  // under-counting an access can only withhold a redundancy claim, never manufacture one.
  if (STDOUT_TO_FILE.test(segment)) return { redirected: true };
  const whole = verbSpec.whole && args.length === 0;
  const slice = whole ? '' : `${verb} ${args.join(' ')}`.trim();
  return { reads: paths.map((path) => ({ path, slice, confirms: verbSpec.confirms })) };
}

// What a Bash command did, as far as a closed list of recognizers can tell. Never a parse tree.
export function recognizeCommand(command) {
  const text = String(command || '');
  const out = {
    massMutation: MASS_MUTATION.test(text),
    compound: COMPOUND.test(text),
    // True only when EVERY segment of the call is a recognized read and nothing in it can have a
    // side effect. It is what separates "this call re-read something" from "this call did nothing
    // but re-read something", and only the second may enter the removable-turn upper bound.
    fullyAccountedReads: false,
    writes: [],          // paths a recognized write targeted
    unresolved: [],      // paths a possible-but-unrecognized write may have touched
    reads: [],           // { path, slice, confirms } a recognized read fetched
    searches: [],        // { path, options, pattern } a recognized search ran
  };

  for (const target of collect(REDIRECT, text, 'last')) {
    if (!target.startsWith('&')) out.writes.push(target);
  }
  out.writes.push(...collect(TEE, text, 'last'));
  out.writes.push(...collect(COPY_MOVE, text, 2));
  if (SED_IN_PLACE.test(text)) out.writes.push(...pathOperands(text.replace(/^[\s\S]*?\bsed\b/, '')));
  out.writes.push(...collect(ESQ_PLAN_WRITE, text, 1));
  out.writes.push(...collect(ESQ_MERGE_LAND, text, 1));
  if (ESQ_BACKLOG_WRITE.test(text)) out.writes.push(BACKLOG_FILE);
  if (ESQ_MERGE_SEAL.test(text)) out.writes.push(BACKLOG_FILE, DECISIONS_FILE);

  if (UNRECOGNIZED_WRITE.test(text)) out.unresolved.push(...pathOperands(text));

  let accountable = !UNACCOUNTABLE.test(text) && !out.massMutation && out.writes.length === 0
    && out.unresolved.length === 0;
  for (const segment of text.split(SEGMENT_SPLIT)) {
    const seen = recognizeReadSegment(segment);
    if (!seen || seen.empty || seen.redirected) { if (!seen) accountable = false; continue; }
    out.reads.push(...(seen.reads || []));
    out.searches.push(...(seen.searches || []));
  }
  out.fullyAccountedReads = accountable && (out.reads.length > 0 || out.searches.length > 0);

  // A path a recognized or possible write targeted is not also counted as a read of it here.
  out.writes = [...new Set(out.writes)];
  out.unresolved = [...new Set(out.unresolved)].filter((p) => !out.writes.includes(p));
  const touched = new Set([...out.writes, ...out.unresolved]);
  out.reads = out.reads.filter((r) => !touched.has(r.path));
  out.searches = out.searches.filter((r) => !touched.has(r.path));
  return out;
}

// ---------------------------------------------------------------- the delivered range
// What a call actually put in front of the agent, taken from the RESULT and never from the request.
// `toolUseResult.file` records it per call: `startLine`, `numLines`, `totalLines` and
// `truncatedByTokenCap`. Measured on this machine's store 2026-09-11 — 2000 Read records carry it,
// 1138 of them a provably complete delivery and 862 provably partial.
//
// ONLY THOSE FOUR KEYS ARE EVER READ from that object. It also carries `content`, the file's actual
// bytes, and `filePath`; neither is read, retained or emitted here. The access path keeps coming
// from the call's own input, through the unchanged `realpath` publication boundary.
export function deliveredRange(toolUseResult) {
  const file = toolUseResult && typeof toolUseResult === 'object' ? toolUseResult.file : null;
  if (!file || typeof file !== 'object') return null;
  if (file.truncatedByTokenCap === true) return null;      // the harness says it cut the delivery
  const start = Number(file.startLine);
  const lines = Number(file.numLines);
  const total = Number(file.totalLines);
  if (!Number.isFinite(start) || !Number.isFinite(lines) || lines < 0) return null;
  if (start < 1) return null;                              // a range that cannot be placed is no range
  return {
    from: start,
    to: start + Math.max(lines, 1) - 1,
    complete: Number.isFinite(total) && start === 1 && lines >= total,
  };
}

// Does `next` reach nothing `prior` had not already delivered?
function containedIn(next, prior) {
  if (!next || !prior) return null;                        // unprovable either way
  if (prior.complete) return true;                         // a complete delivery contains every range
  return next.from >= prior.from && next.to <= prior.to;
}

// ---------------------------------------------------------------- rule presence
// Five-valued on purpose. A transcript with no surviving delivery record is missing evidence, not
// evidence of a missing rule: on this machine's store that distinction is 289 genuine `ruleAbsent`
// runs against 295 with nothing relevant to read.
export function classifyRulePresence(deliveries) {
  if (!deliveries.length) return { value: 'ruleUnknown', skills: [] };
  const skills = [...new Set(deliveries.map((d) => d.skill).filter(Boolean))].sort();
  const relevant = deliveries.filter((d) => d.skill && BLOCK_CARRYING_SKILLS.has(d.skill));
  if (!relevant.length) return { value: 'ruleNotCarried', skills };
  const carrying = relevant.filter((d) => d.hasNeedle);
  if (!carrying.length) return { value: 'ruleAbsent', skills };
  const earliest = Math.min(...carrying.map((d) => d.toolCallsBefore));
  // A delivery record normally follows exactly one tool call — the skill invocation itself.
  // Two or more means the run had already worked before it was handed the rule.
  return { value: earliest <= 1 ? 'ruleLoaded' : 'ruleLoadedMidRun', skills };
}

// ---------------------------------------------------------------- the pure classifier
// `entries` is one agent's transcript, already parsed. No filesystem access: `scopePath` is injected
// by the caller, which is what lets tests/measure fixture every branch without touching ~/.claude.
export function classifyRereads(entries, options = {}) {
  const { scopePath = () => ({ scope: 'foreign', path: null }), cwd = '' } = options;

  const out = {
    classifierVersion: CLASSIFIER_VERSION,
    turns: 0, toolCalls: 0, accessCalls: 0, cacheRead: 0, versions: [],
    rulePresence: 'ruleUnknown', deliveredSkills: [],
    repeats: 0,
    byClass: Object.fromEntries(ALL_CLASSES.map((c) => [c, 0])),
    turnsWithRepeat: 0, repeatOnlyTurns: 0,
    offenders: {},            // published path -> established-redundancy count
    withheldPaths: 0,         // established repeats on a path this boundary refuses to name
    firstSeen: null, lastSeen: null,
  };
  const versions = new Set();

  // Pass 1: results by tool_use id. A result that never arrived is absent, and absence is never
  // read as success — not for a write, and not for a read.
  const results = new Map();
  for (const entry of entries) {
    const content = entry?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type !== 'tool_result') continue;
      results.set(block.tool_use_id, {
        present: true, isError: block.is_error === true, text: textOf(block.content),
        range: deliveredRange(entry.toolUseResult),
      });
    }
  }

  // Pass 2: one ordered walk. `history` is keyed on identity (a resolved path, or a whole search),
  // never on what may be published — the two are deliberately different strings.
  const history = new Map();
  const seenCalls = new Set();
  const turns = new Map();
  const deliveries = [];
  let historyIncomplete = false;
  let turnOrder = 0;

  for (const entry of entries) {
    const at = iso(entry?.timestamp);
    if (at !== null) {
      if (out.firstSeen === null || at < out.firstSeen) out.firstSeen = at;
      if (out.lastSeen === null || at > out.lastSeen) out.lastSeen = at;
    }
    if (entry?.version) versions.add(entry.version);
    const message = entry?.message;
    if (!message || typeof message !== 'object') continue;
    const content = message.content;

    // A skill-delivery record: the harness handing a skill body to this run. The needle counts
    // only here — found in a tool_result it means an agent read a SKILL.md, which proves nothing.
    if (entry.type === 'user' && entry.isMeta === true && Array.isArray(content)) {
      for (const block of content) {
        if (block?.type !== 'text') continue;
        const text = String(block.text || '');
        if (!text.includes(SKILL_DELIVERY_ANCHOR)) continue;
        deliveries.push({
          skill: (SKILL_NAME.exec(text) || [])[1] || null,
          hasNeedle: text.includes(READ_ONCE_NEEDLE),
          toolCallsBefore: out.toolCalls,
        });
      }
    }

    if (entry.type !== 'assistant' || !Array.isArray(content)) continue;

    // One turn is one message.id. A batched turn is written once per tool_use block with `usage`
    // duplicated, so the id is the key and `usage` is taken once, never summed.
    const turnId = message.id || `synthetic-${turnOrder}`;
    let turn = turns.get(turnId);
    if (!turn) {
      turn = { calls: 0, redundantCalls: 0, repeats: 0, order: turnOrder++ };
      turns.set(turnId, turn);
      if (message.usage) {
        out.turns += 1;
        out.cacheRead += message.usage.cache_read_input_tokens || 0;
      }
    }

    for (const block of content) {
      if (block?.type !== 'tool_use') continue;
      if (seenCalls.has(block.id)) continue;     // the same call written into two records
      seenCalls.add(block.id);
      out.toolCalls += 1;
      turn.calls += 1;

      const input = block.input || {};
      const result = results.get(block.id) || { present: false, isError: false, text: '', range: null };
      const accesses = [];
      // A tool call is one access by construction; a Bash call has to earn the claim.
      let accountable = true;

      if (WRITE_TOOLS.has(block.name)) {
        // An Edit/Write is atomic: an error means it did not write, and leaves history untouched.
        applyWrite(history, scopePath, cwd, String(input.file_path || ''), writeOutcome(result, false));
        continue;
      }

      if (READ_TOOLS.has(block.name)) {
        const raw = String(input.file_path || '');
        // A whole-file read has NO slice, and must compare equal to a shell `cat` of the same
        // file — otherwise switching tool reads as `differentSlice` and hides the repeat.
        const sliced = input.offset !== undefined || input.limit !== undefined;
        const slice = sliced ? `read ${input.offset ?? ''}:${input.limit ?? ''}` : '';
        if (raw) accesses.push({ raw, slice, kind: 'file', confirms: true });
      } else if (SEARCH_TOOLS.has(block.name)) {
        const raw = String(input.path || cwd || '');
        accesses.push({ raw, slice: '', kind: 'search', confirms: true, options: searchOptions(input) });
      } else if (block.name === 'Bash') {
        const seen = recognizeCommand(input.command);
        accountable = seen.fullyAccountedReads;
        if (seen.massMutation) historyIncomplete = true;
        const outcome = writeOutcome(result, seen.compound);
        for (const target of seen.writes) applyWrite(history, scopePath, cwd, target, outcome);
        for (const target of seen.unresolved) applyWrite(history, scopePath, cwd, target, 'unrecognized');
        for (const read of seen.reads) {
          accesses.push({ raw: read.path, slice: read.slice, kind: 'file', confirms: read.confirms });
        }
        for (const search of seen.searches) {
          accesses.push({
            raw: search.path, slice: '', kind: 'search', confirms: true,
            options: `${search.options}${SEP}${search.pattern}`,
          });
        }
      }

      let accessesSeen = 0;
      let accessesRedundant = 0;
      for (const access of accesses) {
        accessesSeen += 1;
        const scoped = scopePath(cwd, access.raw);
        const resolved = scoped.key || ['path', access.raw].join(SEP);
        // A search is identified by its whole invocation: two requests that return different
        // information are different accesses, however alike their paths.
        const key = access.kind === 'search' ? ['search', resolved, access.options].join(SEP) : resolved;
        out.accessCalls += 1;
        const prior = history.get(key);
        if (!prior || prior.state === 'written') {
          // No history, or the rule's own exception: this run wrote that file since, so it is not
          // the same file and reading it is the point.
          history.set(key, seedState(result, access.slice, access.confirms));
          continue;
        }
        const klass = classifyRepeat(prior, access, historyIncomplete, result.range);
        out.repeats += 1;
        out.byClass[klass] += 1;
        turn.repeats += 1;
        if (klass === 'identical') {
          accessesRedundant += 1;
          if (scoped.path) out.offenders[scoped.path] = (out.offenders[scoped.path] || 0) + 1;
          else out.withheldPaths += 1;
        }
        history.set(key, seedState(result, access.slice, access.confirms));
      }
      // One CALL is removable only if it did nothing but re-access already-established content.
      // A call producing no access at all — a write, a build, a git command — never qualifies, and
      // neither does one whose command holds anything the recognizer could not account for:
      // `cat f && npm test` re-reads a file AND runs a suite, and the suite is the work.
      if (accessesSeen > 0 && accessesRedundant === accessesSeen && accountable) turn.redundantCalls += 1;
    }
  }

  for (const turn of turns.values()) {
    if (turn.repeats > 0) out.turnsWithRepeat += 1;
    // The upper bound on removable turns: EVERY call in the turn is established redundancy.
    // One different slice, one unresolved class or one piece of other work disqualifies it.
    if (turn.calls > 0 && turn.redundantCalls === turn.calls) out.repeatOnlyTurns += 1;
  }

  const presence = classifyRulePresence(deliveries);
  out.rulePresence = presence.value;
  out.deliveredSkills = presence.skills;
  out.versions = [...versions].sort();
  return out;
}

// A write's outcome, never resolved in a direction the evidence does not support. An absent result
// is not a confirmed write; a failed compound command may have written before it failed.
function writeOutcome(result, compound) {
  if (!result.present) return 'uncertain';
  if (result.isError) return compound ? 'uncertain' : 'none';
  return 'written';
}

const OUTCOME_STATE = { written: 'written', uncertain: 'uncertainWrite', unrecognized: 'unrecognizedWrite' };

function applyWrite(history, scopePath, cwd, raw, outcome) {
  if (!raw || outcome === 'none') return;
  const scoped = scopePath(cwd, raw);
  const key = scoped.key || ['path', raw].join(SEP);
  const state = OUTCOME_STATE[outcome];
  history.set(key, { state, slice: '' });
  // A search can cover a file it never names — a directory grep, a glob — so a write invalidates
  // EVERY search this run has run, not merely the one path key it targeted. Conservative on
  // purpose: it can only move a repeat out of established redundancy, never into it.
  for (const [existing, entry] of history) {
    if (existing.startsWith(`search${SEP}`) && entry.state !== state) {
      history.set(existing, { state, slice: '' });
    }
  }
}

// Every option a search carries, normalized: anything that changes what comes back changes the
// identity, so a `files_with_matches` request and a `content` request are two different accesses.
function searchOptions(input) {
  return JSON.stringify(Object.entries(input || {})
    .filter(([key, value]) => key !== 'path' && value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b)));
}

// What this access establishes about the content, for the benefit of the NEXT one. A missing or
// failed result never establishes that the agent received the content.
function seedState(result, slice, confirms = true) {
  // `confirms` is false where the operation itself never delivers the content — `wc` returns a
  // count — so the next access to that path is unresolved rather than redundant.
  if (!confirms || !result.present || result.isError) return { state: 'unconfirmed', slice, range: null };
  if (TRUNCATION.test(result.text)) return { state: 'truncated', slice, range: null };
  return { state: 'confirmed', slice, range: result.range || null };
}

// The order is the argument. Same access identity is redundancy as it always was; beyond that the
// question is only ever what the RESULTS prove about overlap, and anything they do not prove is
// unresolved rather than legitimate.
function classifyRepeat(prior, access, historyIncomplete, range) {
  if (historyIncomplete) return 'historyIncomplete';
  if (prior.state === 'unrecognizedWrite') return 'afterUnrecognizedWrite';
  if (prior.state === 'uncertainWrite') return 'afterUncertainWrite';
  if (prior.state === 'unconfirmed') return 'afterUnconfirmedRead';
  if (prior.state === 'truncated') return 'afterTruncation';
  if (access.kind !== 'file' || access.slice === prior.slice) return 'identical';
  // Different operation or different arguments: only the delivered ranges can settle it.
  const contained = containedIn(range, prior.range);
  if (contained === true) return 'identical';              // proven: nothing new arrived
  if (contained === false) return 'broaderAccess';         // proven: lines the prior never delivered
  return 'overlapUnknown';                                 // neither result said — and that is the answer
}

// ---------------------------------------------------------------- the path boundary
// A local cwd says where the agent stood, never where it read. Publication is decided per path:
// resolve against the run's own cwd, realpath it, and publish only what lands inside this
// repository. That is what rejects an absolute path elsewhere, a `../` escape and a symlink out.
// `realpath` must return null when it cannot resolve — a lexical fallback is exactly the bug this
// signature exists to prevent, because `path.resolve` follows no symlink and proves no containment.
export function makeScopePath(repoRoot, realpath = null) {
  const resolveReal = realpath || ((p) => {
    try { return fsRealpathSync(p); } catch { return null; }
  });
  const root = resolveReal(repoRoot) || path.resolve(repoRoot);
  const cache = new Map();
  return (cwd, raw) => {
    if (!raw) return { scope: 'foreign', path: null, key: null };
    const cacheKey = `${cwd}${SEP}${raw}`;
    const hit = cache.get(cacheKey);
    if (hit) return hit;
    const expanded = raw.startsWith('~/') ? path.join(os.homedir(), raw.slice(2)) : raw;
    const absolute = path.isAbsolute(expanded) ? expanded : path.resolve(cwd || root, expanded);
    const real = resolveReal(absolute);
    // A path that does not resolve is NOT proven to be inside this repository: a missing target
    // beneath a symlink pointing out of the tree resolves nowhere, and publishing its lexical
    // spelling would name a file that is not ours. Identity still needs a key, so the lexical form
    // is kept INTERNALLY — it never leaves the process — and publication is withheld.
    const verified = real !== null && real !== undefined;
    const relative = verified ? path.relative(root, real) : null;
    // `path.relative(root, root)` is the empty string, and the root IS inside the repository —
    // reading '' as outside classified every run in this very checkout as foreign.
    const inside = verified && !relative.startsWith('..') && !path.isAbsolute(relative);
    // The key is the resolved identity and never leaves the process; `path` is what may be printed.
    const out = {
      scope: inside ? 'local' : 'foreign',
      path: inside ? (relative || '.') : null,
      key: `path${SEP}${verified ? real : path.resolve(absolute)}`,
      verified,
    };
    cache.set(cacheKey, out);
    return out;
  };
}

// ---------------------------------------------------------------- local stores
async function labelledAgents() {
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

// How much of the label store has a transcript to read, computed over the WHOLE store. It takes no
// window, and that is the point: a `--through` that excludes newer runs is a SELECTION, and
// reporting it as coverage manufactured missing joins that were never missing.
export function matchCorpus(labelIds, transcriptIds) {
  const labelled = [...labelIds];
  const matched = labelled.filter((id) => transcriptIds.has(id));
  return {
    labelledByEsq: labelled.length,
    labelledWithTranscript: matched.length,
    matchCoverage: labelled.length ? matched.length / labelled.length : null,
    unlabelledTranscripts: [...transcriptIds].filter((id) => !labelIds.has(id)).length,
  };
}

// The repository this reading is taken in, found by walking up for a `.git`. No spawn, no dependency.
function repositoryRoot(from) {
  let dir = path.resolve(from);
  for (;;) {
    if (existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(from);
    dir = parent;
  }
}

// ---------------------------------------------------------------- the report
// Cohorts, never a pooled headline. Two repositories with different ledger layouts do not share a
// denominator, and neither do two commands — so scope and command are cells, not a sum.
export function summarize(runs, context) {
  const cells = new Map();
  for (const run of runs) {
    const key = [run.command, run.scope, run.rulePresence].join(SEP);
    let cell = cells.get(key);
    if (!cell) {
      cell = {
        command: run.command, scope: run.scope, rulePresence: run.rulePresence,
        runs: 0, eligibleRuns: 0, turns: 0, toolCalls: 0, accessCalls: 0,
        repeats: 0, byClass: Object.fromEntries(ALL_CLASSES.map((c) => [c, 0])),
        turnsWithRepeat: 0, repeatOnlyTurns: 0, withheldPaths: 0, offenders: {},
      };
      cells.set(key, cell);
    }
    cell.runs += 1;
    // Eligible: the run actually accessed at least one path, so it could have repeated one.
    if (run.accessCalls > 0) cell.eligibleRuns += 1;
    for (const field of ['turns', 'toolCalls', 'accessCalls', 'repeats', 'turnsWithRepeat', 'repeatOnlyTurns', 'withheldPaths']) {
      cell[field] += run[field];
    }
    for (const klass of ALL_CLASSES) cell.byClass[klass] += run.byClass[klass];
    if (run.scope === 'local') {
      for (const [file, count] of Object.entries(run.offenders)) {
        cell.offenders[file] = (cell.offenders[file] || 0) + count;
      }
    }
  }

  const rows = [...cells.values()].map((cell) => {
    const resolved = cell.repeats - CLASS_GROUPS.unresolved.reduce((t, k) => t + cell.byClass[k], 0);
    return {
      ...cell,
      // Reported side by side, never combined: coverage says how much of the reading is settled,
      // the redundancy count says what was settled AS waste.
      classificationCoverage: cell.repeats ? resolved / cell.repeats : null,
      redundantPerRun: cell.eligibleRuns ? cell.byClass.identical / cell.eligibleRuns : null,
      redundantPerAccessCall: cell.accessCalls ? cell.byClass.identical / cell.accessCalls : null,
      repeatsPerRun: cell.eligibleRuns ? cell.repeats / cell.eligibleRuns : null,
      topOffenders: Object.entries(cell.offenders).sort((a, b) => b[1] - a[1]).slice(0, 10),
    };
  }).sort((a, b) => b.eligibleRuns - a.eligibleRuns || a.command.localeCompare(b.command));

  return {
    classifierVersion: CLASSIFIER_VERSION,
    window: { since: context.since || null, through: context.through || null, open: !context.through },
    measuredAt: context.through || new Date().toISOString(),
    corpus: {
      transcriptsOnDisk: context.transcriptsOnDisk,
      // MATCHING is window-independent: how much of the label store has a transcript at all.
      ...context.match,
      // SELECTION is what the window kept, and is deliberately named as such. It is not coverage,
      // and a narrower window lowering it says nothing about a missing transcript.
      selection: {
        selectedRuns: context.selected,
        excludedByWindow: context.outsideWindow,
        selectedFraction: context.match.labelledWithTranscript
          ? context.selected / context.match.labelledWithTranscript : null,
      },
      // An absent transcript cannot be attributed to a command or a rule-presence value, so
      // per-cohort matching coverage is NOT computable here and is not reported as if it were.
      perCohortMatchCoverage: null,
    },
    versions: context.versions,
    rows,
  };
}

function pct(value) { return value === null ? '  n/a' : `${(value * 100).toFixed(0).padStart(4)}%`; }
function num(value, places = 2) { return value === null ? 'n/a' : value.toFixed(places); }

function render(summary) {
  const c = summary.corpus;
  const window = summary.window.open
    ? 'open-ended — a MOVING corpus; pass --through <iso> to freeze it'
    : `${summary.window.since || 'start'} … ${summary.window.through}`;
  const lines = [
    `window      ${window}`,
    `            classifier v${summary.classifierVersion} · Claude Code ${summary.versions.join(', ') || 'unknown'}`,
    `matching    ${c.labelledWithTranscript}/${c.labelledByEsq} labelled rows have a transcript on disk — coverage ${pct(c.matchCoverage)} (whole store, window-independent)`,
    `            ${c.transcriptsOnDisk} transcripts on disk · ${c.unlabelledTranscripts} of them not labelled by esq`,
    `selection   ${c.selection.selectedRuns} runs in this window (${pct(c.selection.selectedFraction)} of matched), ${c.selection.excludedByWindow} excluded by it — a SELECTION, not missing joins`,
    '            per-cohort matching coverage is not computable: an absent transcript has no command and no rule presence',
    '',
    'command        scope    rule presence        runs  elig   acc  repeats  covg   redundant  /run  /acc   turns+r  onlyR  withheld',
  ];
  for (const row of summary.rows) {
    lines.push([
      row.command.padEnd(14),
      row.scope.padEnd(8),
      row.rulePresence.padEnd(20),
      String(row.runs).padStart(4),
      String(row.eligibleRuns).padStart(5),
      String(row.accessCalls).padStart(5),
      String(row.repeats).padStart(8),
      pct(row.classificationCoverage),
      String(row.byClass.identical).padStart(11),
      num(row.redundantPerRun).padStart(5),
      num(row.redundantPerAccessCall, 3).padStart(5),
      String(row.turnsWithRepeat).padStart(9),
      String(row.repeatOnlyTurns).padStart(6),
      String(row.withheldPaths).padStart(9),
    ].join(' '));
  }
  lines.push('');
  lines.push('classes     ' + ALL_CLASSES.map((k) => `${k}=${summary.rows.reduce((t, r) => t + r.byClass[k], 0)}`).join(' · '));
  lines.push('            redundant = established · differentSlice/afterTruncation = classified legitimate · the rest = unresolved');
  lines.push('            onlyR is turns whose EVERY call is established redundancy — an UPPER BOUND on removable turns,');
  lines.push('            not a saving. No count here is converted into seconds or tokens.');

  const primary = summary.rows.filter((r) => r.command === 'build' && r.scope === 'local');
  if (primary.length) {
    lines.push('');
    lines.push('offenders   (local build runs only; a path is named only if it resolves inside this repository)');
    for (const row of primary) {
      for (const [file, count] of row.topOffenders.slice(0, 5)) {
        lines.push(`            ${row.rulePresence.padEnd(20)} ${String(count).padStart(4)}  ${file}`);
      }
    }
  }
  return `${lines.join('\n')}\n`;
}

// ---------------------------------------------------------------- entry point
async function main(argv) {
  const asJson = argv.includes('--json');
  const at = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
  const since = at('--since');
  const through = at('--through');
  for (const [flag, value] of [['--since', since], ['--through', through]]) {
    if (value !== null && (value === undefined || Number.isNaN(Date.parse(value)))) {
      process.stderr.write(`${flag} is not an ISO timestamp: ${value}\n`);
      process.exitCode = 2;
      return;
    }
  }
  const from = iso(since);
  const to = iso(through);

  const root = repositoryRoot(process.cwd());
  const scopePath = makeScopePath(root);
  const [labels, files] = await Promise.all([labelledAgents(), transcripts()]);

  const runs = [];
  const versions = new Set();
  let outsideWindow = 0;
  for (const [agentId, file] of files) {
    const command = labels.get(agentId);
    if (!command) continue;
    const entries = [];
    for (const line of (await readFile(file, 'utf8')).split('\n')) {
      if (!line.trim()) continue;
      try { entries.push(JSON.parse(line)); } catch { /* a truncated tail is not a measurement */ }
    }
    const cwd = entries.find((entry) => entry.cwd)?.cwd || '';
    const classified = classifyRereads(entries, { scopePath, cwd });
    // A window selects whole RUNS by their first timestamp, and the run is then classified over its
    // entire transcript. Filtering record by record would truncate a run's read and write history
    // at the boundary and let one run contribute to both cohorts.
    if (classified.firstSeen !== null) {
      if (from !== null && classified.firstSeen < from) { outsideWindow += 1; continue; }
      if (to !== null && classified.firstSeen > to) { outsideWindow += 1; continue; }
    }
    for (const version of classified.versions) versions.add(version);
    runs.push({
      ...classified,
      command: command.replace(/^esq:/, ''),
      scope: cwd && scopePath(cwd, cwd).scope === 'local' ? 'local' : 'foreign',
    });
  }

  if (!runs.length) {
    process.stderr.write('nothing to check — no esq-labelled agent transcript in this window\n');
    process.exitCode = 2;
    return;
  }

  const summary = summarize(runs, {
    since, through, versions: [...versions].sort(),
    transcriptsOnDisk: files.size,
    match: matchCorpus(new Set(labels.keys()), new Set(files.keys())),
    selected: runs.length, outsideWindow,
  });
  process.stdout.write(asJson ? `${JSON.stringify(summary, null, 2)}\n` : render(summary));
}

if (import.meta.url === `file://${process.argv[1]}`) await main(process.argv.slice(2));
