import { execFileSync, spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { appendFile, mkdir, open, readdir, readFile, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ABANDONED_LINE, REVIEWED_AT_LINE, atomicWrite, autoSteps, declaredInputs, extractAutoCommand, formatRow, nextPhase, parseBranch, parseAbandoned, parseOrigin, parsePlan, parseReviewedAt, parseVerified, readText, splitTableRow, tableAt } from './markdown.mjs';
import { canonicalPlanSlug, telemetryOptedOut } from '../scripts/hook-io.mjs';
import { MIN_SAMPLE_RUNS, discoverTelemetryFiles, renderTelemetrySummary, repoKey, summarizeTelemetry } from './telemetry.mjs';

const STATUSES = new Set(['Open', 'Needs-decision', 'Planned', 'Done', 'Dropped']);

// A corrective brief is named `<stem>-fixes.brief.md` (with the `-2`/`-3` uniquifier `/esq:review`
// and `/esq:converge` append when one already sits beside the plan). A brief that corrects nothing —
// a grill brief, written before any plan exists — carries no stem and is refused rather than resolved
// to whatever plan happens to share its slug.
const CORRECTIVE_BRIEF = /-fixes(?:-\d+)?\.brief\.md$/;


// `docs/plans/2026-08-19-telemetry-summary.md` → `telemetry-summary`. Slugs are what joins a plan,
// the briefs that correct it, the commits that produced them and the backlog rows that cite it —
// the date prefix and the finder's `-2`/`-3` uniquifier are noise on all four. The body lives in
// `plugin/scripts/hook-io.mjs` beside the shapes it feeds, because the agent recorder applies the
// same derivation to a declared `plan:` marker; the name stays here so every call site is untouched.
export const normalizeSlug = canonicalPlanSlug;

function planSlug(file) {
  return normalizeSlug(path.basename(file).replace(/\.md$/, ''));
}

// `2026-08-19-telemetry-summary-fixes.brief.md` → `telemetry-summary`, and so does the second-round
// `-fixes-2` of the same plan: the uniquifier belongs to the brief, never to the plan it corrects, so
// the whole `-fixes(-<n>)` group comes off in one bite. Stripping only `-fixes` would leave
// `normalizeSlug` to eat the `-2` on its own and answer `telemetry-summary-fixes` — the slug of the
// *plan written from* that brief, which is a different plan and a wrong identity.
function briefSlug(file) {
  return normalizeSlug(path.basename(file).replace(/\.brief\.md$/, '').replace(/-fixes(?:-\d+)?$/, ''));
}

function fileDate(file) {
  return path.basename(file).match(/^(\d{4}-\d{2}-\d{2})-/)?.[1] ?? null;
}

// The corrective-brief format /esq:check and /esq:review write: one `## 🟢|🟡|🔴 …` heading per
// tier, one top-level `- ` bullet per finding. An indented line is part of a 🔴's option set, never
// a second finding, so only column-zero bullets count.
const TIERS = [['green', '🟢'], ['yellow', '🟡'], ['red', '🔴']];

function tierCounts(text) {
  const counts = Object.fromEntries(TIERS.map(([name]) => [name, 0]));
  let tier = null;
  for (const line of text.split('\n')) {
    const heading = /^##\s+(.)/.exec(line);
    if (heading) {
      tier = TIERS.find(([, glyph]) => line.includes(glyph))?.[0] ?? null;
      continue;
    }
    if (tier && /^- /.test(line)) counts[tier] += 1;
  }
  return counts;
}

// `esq brief plan <fixes-brief>` — the plan a corrective brief corrects, by slug, through one readdir
// of the brief's own directory, never a path guess: a brief and the plan it corrects are siblings
// there, and the slug is what joins them (`normalizeSlug`).
//
// THIS IS THE ONLY PLACE A `/esq:fix` RUN GETS THAT PATH. The brief it was handed is deleted by the
// end of a run that applied everything in it, and `→ Next` has to name the plan after it is gone —
// so the resolution is made once, early, and kept. It outlived the lane it used to ride along with.
//
// It answers three things, because three consumers each need one of them and none should re-read the
// brief to get it: `plan` (the path, or `null` for a brief targeting a commit range), `range` (that
// range, or `null`), and `finder` — `check` or `review`, from the `Source:` line. **`finder` is what
// stops `/esq:converge` certifying a unit no reviewer ever read:** entering from a `check` brief runs
// a fix and no review, so the run may not record review coverage on the strength of it.
//
// THE FILENAME PROPOSES AND THE `Source:` DISPOSES, AND NEITHER ONE WINS A DISAGREEMENT. `/esq:fix`
// hands the returned path to the user as the plan to review next, so a wrong answer here is a user
// sent to review a plan their brief never identified. Two ways that happened before this validation
// existed, both reproduced: a brief named `…-alpha-fixes-2.brief.md` whose `Source:` said `beta`
// resolved to `alpha`, and two plans normalizing to one slug resolved to whichever sorted first.
// So the lookup stays by filename and gains two refusals — a `Source:` naming another plan, and more
// than one candidate. It refuses rather than ranking the two, because which of them carries the
// mistake is not something this function can know, and a preference would turn a visible clash into
// a silent wrong answer (`D-a-brief-identity-is-validated-never-ranked`).
//
// A brief with no parseable `Source:` resolves by filename exactly as it always did — that is every
// brief written before the header existed, and the fallback is never a refusal.
// A `Source:` target that names a COMMIT RANGE rather than a plan slug. `/esq:review` writes one when
// it was invoked on `<A>..<B>` or a single commit-ish — a change with no plan file, which is what an
// inline `/esq:work` fix produces. A slug is `[a-z0-9-]` by construction and can never contain `..`,
// so the two shapes cannot be confused, and the discriminator is the producer's own declaration
// rather than a guess about what is on disk.
const BRIEF_RANGE_TARGET = /^[0-9a-f]{7,40}\.\.[0-9a-f]{7,40}$/;

export async function briefPlan(file) {
  const base = path.basename(file);
  if (!CORRECTIVE_BRIEF.test(base)) {
    throw new Error(`${file}: esq brief plan reads a \`*-fixes.brief.md\` — a brief that corrects nothing carries no plan`);
  }
  const directory = path.dirname(file);
  const slug = briefSlug(file);

  // `REVIEW_BRIEF_SOURCE` and not `BRIEF_SOURCE`: the comma it requires is what ends the target, so a
  // `<slug>-fixes` brief never answers for `<slug>`. **Only an absent brief is silent.** A brief that
  // is there and cannot be read carries a claim this code could not check, and swallowing that read
  // puts the pre-validation behavior back — it resolves by filename alone, silently, which is the
  // defect this whole guard exists to remove.
  let source = null;
  try { source = REVIEW_BRIEF_SOURCE.exec(await readText(file)); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const finder = source?.[1] ?? null;
  const declared = source?.[2] ?? null;

  // THE RANGE CASE, and the only thing that makes a brief plan-less: its own `Source:` says so.
  // Everything below — the three refusals — is for a brief that claims a plan, and none of them is
  // relaxed. A brief whose `Source:` cannot be read is NOT plan-less: it resolves by filename exactly
  // as it always did, and reports the slug miss if there is one.
  if (declared !== null && BRIEF_RANGE_TARGET.test(declared)) {
    return { brief: file, plan: null, range: declared, finder };
  }

  let names = [];
  try {
    names = (await readdir(directory, { withFileTypes: true }))
      .filter((item) => item.isFile() && item.name.endsWith('.md'))
      .map((item) => item.name)
      .sort();
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  }
  if (declared !== null) {
    const claimed = normalizeSlug(declared);
    if (claimed !== slug) {
      throw new Error(`${file}: its \`Source:\` names \`${claimed}\` but its filename says \`${slug}\` — rename the brief or correct its \`Source:\`, whichever is wrong`);
    }
  }
  const matches = names.filter((name) => !name.endsWith('.brief.md') && !name.endsWith('.log.md') && normalizeSlug(name.replace(/\.md$/, '')) === slug);
  if (matches.length === 0) throw new Error(`${file}: no plan beside this brief carries the slug \`${slug}\` it corrects`);
  if (matches.length > 1) {
    throw new Error(`${file}: ${matches.length} plans beside this brief carry the slug \`${slug}\` it corrects — ${matches.join(', ')}`);
  }
  return { brief: file, plan: path.join(directory, matches[0]), range: null, finder };
}
function output(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function git(root, args) {
  if (process.env.NODE_ENV === 'test' && process.env.ESQ_TEST_GIT_ROOT) {
    const command = args.join(' ');
    if (command === 'rev-parse --show-toplevel') return process.env.ESQ_TEST_GIT_ROOT;
    if (command === 'branch --show-current') return 'fixture';
    if (command === 'status --porcelain') return '';
    // `lane stats`' one history read. A fixture tree has no commits of its own, so the seam serves
    // the lines the test wants measured — the same `<hash> <date> <subject>` shape the command's
    // own `--format=%h %ad %s --date=short` prints.
    if (args[0] === 'log') return process.env.ESQ_TEST_GIT_LOG ?? '';
    throw new Error(`unsupported test git command: ${command}`);
  }
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function normalizeId(value) {
  const match = String(value).match(/^(?:B-|#)?(\d+)$/i);
  if (!match) throw new Error(`invalid backlog ID: ${value}`);
  return `B-${String(Number(match[1])).padStart(3, '0')}`;
}

async function backlogTable(file) {
  return backlogTableFromText(await readText(file));
}

// The same shape over text already in hand — a backlog read off another branch with `git show`
// never touches the working tree.
function backlogTableFromText(text) {
  const lines = text.split('\n');
  // Real backlogs head the id column either `ID` or `#` (older esq installs wrote `#`).
  let idHeader = 'ID';
  let table;
  try { table = tableAt(lines, 'ID'); }
  catch {
    try { table = tableAt(lines, '#'); idHeader = '#'; }
    catch { throw new Error('Markdown table with ID header not found'); }
  }
  const idColumn = table.header.indexOf(idHeader);
  const statusColumn = table.header.indexOf('Status');
  if (statusColumn < 0) throw new Error('backlog table has no Status column');
  return { text, lines, table, idColumn, statusColumn };
}

// The tenth field of the backlog row schema. A rank is a *projection* of two judgments — the row's
// priority and the roadmap's edges — never a third thing to keep in sync, so nothing hand-edits this
// cell and no skill writes it directly: capture/reopening assigns the neutral tail, closure clears
// it, and `esq backlog rank` owns explicit placement and renumbering. The `hi #2` a reader sees is
// computed from the bucket at render time rather than stored.
//
// The column is added lazily, and that is deliberate rather than lazy: every esquisse project already
// on disk has a nine-column backlog, and a reader that demanded a tenth would break all of them at
// once. So a backlog gains the column on the first write that needs it — header, separator and every
// existing row padded in the same pass, before any value is written — and until then every consumer
// reads a blank rank, which is exactly what `backlogRows` already returns for an absent column.
const RANK_COLUMN = 'Rank';

// Widen a parsed table in place, returning the widened `{header, rows}` view of it. Rank sits
// immediately after the priority cell it breaks ties inside; a table with no priority column at all
// (no canonical ledger has one, but a hand-made fixture can) appends it last rather than guessing.
// A no-op on a table that already carries the column, so callers may call it unconditionally.
function addRankColumn(lines, table) {
  if (table.header.includes(RANK_COLUMN)) return table;
  const priIndex = ['Pri', 'Priority'].map((name) => table.header.indexOf(name)).find((index) => index >= 0) ?? -1;
  const at = priIndex >= 0 ? priIndex + 1 : table.header.length;
  const widen = (cells, value) => { const next = cells.slice(); next.splice(at, 0, value); return next; };
  const header = widen(table.header, RANK_COLUMN);
  const separator = widen(splitTableRow(lines[table.start + 1]), '---');
  const rows = table.rows.map((row) => widen(row, ''));
  lines[table.start] = formatRow(header);
  lines[table.start + 1] = formatRow(separator);
  rows.forEach((row, offset) => { lines[table.start + 2 + offset] = formatRow(row); });
  return { ...table, header, rows };
}

// The statuses /esq:status acts on: Open and Needs-decision are the actionable rows; Planned rides along
// because its Source cell carries the ` · Planned by <slug>` marker Step 4.5 reads. Done/Dropped stay counts.
const ROW_STATUSES = new Set(['Open', 'Needs-decision', 'Planned']);

function backlogRows({ table, idColumn, statusColumn }) {
  const column = (...names) => names.map((name) => table.header.indexOf(name)).find((index) => index >= 0) ?? -1;
  const cell = (row, index) => (index >= 0 ? (row[index] ?? '') : '');
  const priColumn = column('Pri', 'Priority');
  const rankColumn = column(RANK_COLUMN);
  const summaryColumn = column('Summary');
  const epicColumn = column('Epic');
  const sourceColumn = column('Source');
  return table.rows
    .filter((row) => ROW_STATUSES.has(row[statusColumn]))
    .map((row) => ({
      id: cell(row, idColumn),
      pri: cell(row, priColumn),
      rank: cell(row, rankColumn),
      summary: cell(row, summaryColumn),
      status: row[statusColumn],
      epic: cell(row, epicColumn),
      source: cell(row, sourceColumn),
    }));
}

// ── Worktree ID blocks ───────────────────────────────────────────────────────
// A `B-NNN` is a permanent citation key, so two working trees must never mint the same one. The main
// checkout is block 0 (`1-999`) and holds no marker; a linked worktree owns `k*1000 .. k*1000+999`,
// recorded as `id-block: <lo>-<hi>` in `.esq-id-block` at its root. Until 2026-09-11 a linked
// worktree created without that marker silently minted from block 0 — main's own range — and two
// Linked worktrees had to renumber duplicate IDs by hand. So a linked worktree with no marker
// now reserves one, and the reservation is ONE critical section: choosing the lowest free index and
// writing the marker happen under a lock in the shared git common directory, because an atomic
// marker write alone does not stop two worktrees from choosing the same free index. `scripts/
// worktree.sh` and `/esq:worktree` call this same verb, so creation and first use cannot disagree.
const ID_BLOCK_FILE = '.esq-id-block';
const ID_BLOCK_SIZE = 1000;
const ID_BLOCK_LOCK = 'esq-id-block.lock';
// How long a reservation waits for another one to finish. A constant, not a flag: the critical
// section is a handful of reads and one small write, so a lock held longer than this is a lock a
// crashed process left behind, and the refusal names the file rather than guessing it is stale.
const ID_BLOCK_LOCK_WAIT_MS = 10_000;

function parseIdBlock(text) {
  const match = String(text).trim().match(/^id-block:\s*(\d+)-(\d+)$/);
  if (!match) throw new Error('malformed .esq-id-block; expected id-block: <lo>-<hi>');
  const low = Number(match[1]); const high = Number(match[2]);
  if (low > high) throw new Error('malformed .esq-id-block; lower bound exceeds upper bound');
  return { low, high };
}

async function readIdBlock(directory) {
  try { return parseIdBlock(await readFile(path.join(directory, ID_BLOCK_FILE), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

// Git's worktree registry, parsed once. `git worktree list --porcelain` emits one blank-line-separated
// stanza per registered worktree: a `worktree <path>` line, then `HEAD <oid>`, then either
// `branch refs/heads/<name>` or `detached`, plus a `locked` or `prunable` annotation where one applies
// (each optionally carrying a reason after a space). Two callers read it — the ID-block allocator, which
// wants the paths, and the landing-site resolver, which wants the branch and the annotations — and one
// parser is what keeps them from disagreeing about what git said.
//
// The plain porcelain format cannot represent a path containing a newline, so such a stanza garbles.
// That is left to fail rather than papered over: the allocator sees a path that is not one of its
// worktrees, and `landingSite` re-asks the chosen directory itself and refuses what does not answer.
// `-z` would be exact and needs git 2.36; the failure here is safe and costs no version floor.
function worktreeRecords(directory) {
  const raw = gitTry(directory, ['worktree', 'list', '--porcelain']);
  if (raw === null) return [];
  const records = [];
  let current = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('worktree ')) {
      current = { path: line.slice('worktree '.length), branch: null, detached: false, locked: false, prunable: false };
      records.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith('branch refs/heads/')) current.branch = line.slice('branch refs/heads/'.length);
    else if (line === 'detached') current.detached = true;
    else if (line === 'locked' || line.startsWith('locked ')) current.locked = true;
    else if (line === 'prunable' || line.startsWith('prunable ')) current.prunable = true;
  }
  return records;
}

// Where a working tree sits among its siblings. `null` when git cannot answer (no repository, or the
// CLI's test seam), which every caller reads as the main checkout — the historical behavior.
function worktreeLayout(directory) {
  const top = gitTry(directory, ['rev-parse', '--show-toplevel']);
  if (!top) return null;
  const gitDir = gitTry(top, ['rev-parse', '--absolute-git-dir']);
  const commonOut = gitTry(top, ['rev-parse', '--git-common-dir']);
  if (!gitDir || !commonOut) return null;
  const common = path.resolve(top, commonOut);
  const worktrees = worktreeRecords(top).map((record) => record.path);
  return { top, common, linked: path.resolve(gitDir) !== common, main: worktrees[0] ?? top, worktrees };
}

async function takeIdBlockLock(common) {
  const lock = path.join(common, ID_BLOCK_LOCK);
  const deadline = Date.now() + ID_BLOCK_LOCK_WAIT_MS;
  for (;;) {
    try {
      const handle = await open(lock, 'wx');
      await handle.writeFile(`${process.pid}\n`);
      await handle.close();
      return lock;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() > deadline) {
        throw new Error(`another ID-block reservation still holds ${lock} after ${ID_BLOCK_LOCK_WAIT_MS / 1000}s — if no esq or worktree.sh process is running, remove that file and retry`);
      }
      await new Promise((resolve) => { setTimeout(resolve, 25 + Math.floor(Math.random() * 25)); });
    }
  }
}

// Read-only: the block this working tree may allocate from, and where that answer came from.
// `missing` is a linked worktree with no marker yet — the next reservation creates one.
export async function idBlock(directory) {
  const layout = worktreeLayout(directory);
  const marker = await readIdBlock(layout?.top ?? directory);
  if (marker) return { ...marker, source: 'marker' };
  if (layout?.linked) return { low: null, high: null, source: 'missing' };
  return { low: 1, high: 999, source: 'main' };
}

export async function reserveBlock(directory) {
  const layout = worktreeLayout(directory);
  const existing = await readIdBlock(layout?.top ?? directory);
  if (existing) return { ...existing, source: 'marker', reserved: false, worktree: layout?.top ?? directory };
  if (!layout?.linked) return { low: 1, high: 999, source: 'main', reserved: false, worktree: layout?.top ?? directory };

  const lock = await takeIdBlockLock(layout.common);
  try {
    // Everything the choice depends on is read again inside the lock, because everything read before
    // it may be stale by the time the lock is ours: this worktree may have won a concurrent reservation,
    // and a sibling worktree may have been created — and have allocated its own block — while this
    // reservation waited. The inventory taken before the wait is used for nothing below this line.
    const raced = await readIdBlock(layout.top);
    if (raced) return { ...raced, source: 'marker', reserved: false, worktree: layout.top };
    const inventory = worktreeLayout(layout.top);
    if (!inventory?.linked) throw new Error(`${layout.top} is no longer a linked worktree of this repository — no ID block was reserved`);
    const taken = new Set([0]);
    const witness = (text) => {
      for (const match of text.matchAll(/\bB-(\d+)\b/g)) taken.add(Math.floor(Number(match[1]) / ID_BLOCK_SIZE));
    };
    for (const tree of inventory.worktrees) {
      let marker = null;
      try { marker = await readIdBlock(tree); } catch { marker = null; }
      if (marker) taken.add(Math.floor(marker.low / ID_BLOCK_SIZE));
    }
    // A block whose numbers already exist in main's backlog is never handed out again — that is what
    // stops a worktree branched from a stale base from re-minting an ID that already shipped.
    try {
      const text = await readFile(path.join(inventory.main, 'docs/BACKLOG.md'), 'utf8');
      witness(text);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    // Removing a worktree removes its marker, not its committed IDs. Local branch tips are durable
    // witnesses too, whether or not git considers them merged (main's checkout can be on another
    // branch). Pin object IDs and read each distinct backlog blob once; no history walk or registry.
    // ls-tree distinguishes an absent backlog from an unreadable object: only absence is harmless.
    const tips = new Set(git(inventory.top, ['for-each-ref', '--format=%(objectname)', 'refs/heads/']).split('\n').filter(Boolean));
    const blobs = new Set();
    for (const tip of tips) {
      const entry = git(inventory.top, ['ls-tree', tip, '--', 'docs/BACKLOG.md']);
      if (!entry) continue;
      const blob = /^\d+ blob ([0-9a-f]+)\t/.exec(entry)?.[1];
      if (!blob) throw new Error(`docs/BACKLOG.md at ${tip} is not a blob — no ID block was reserved`);
      if (blobs.has(blob)) continue;
      blobs.add(blob);
      witness(git(inventory.top, ['cat-file', 'blob', blob]));
    }
    let index = 1;
    while (taken.has(index)) index += 1;
    const low = index * ID_BLOCK_SIZE;
    const high = low + ID_BLOCK_SIZE - 1;
    const handle = await open(path.join(layout.top, ID_BLOCK_FILE), 'wx');
    await handle.writeFile(`id-block: ${low}-${high}\n`);
    await handle.close();
    // Keep the marker untracked everywhere: info/exclude lives in the common directory every linked
    // worktree inherits. Appended once, never rewritten.
    const exclude = path.join(layout.common, 'info', 'exclude');
    let current = '';
    try { current = await readFile(exclude, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!current.split('\n').includes(ID_BLOCK_FILE)) {
      await mkdir(path.dirname(exclude), { recursive: true });
      await appendFile(exclude, `${current && !current.endsWith('\n') ? '\n' : ''}${ID_BLOCK_FILE}\n`);
    }
    return { low, high, source: 'marker', reserved: true, worktree: layout.top };
  } finally {
    await unlink(lock).catch(() => {});
  }
}

export async function reserveId(root, file) {
  const { table, idColumn } = await backlogTable(file);
  const block = await reserveBlock(root);
  const { low, high } = block;
  const used = table.rows
    .map((row) => row[idColumn]?.match(/^B-(\d+)$/)?.[1])
    .filter(Boolean).map(Number).filter((id) => id >= low && id <= high);
  const next = used.length === 0 ? low : Math.max(...used) + 1;
  if (next > high) throw new Error(`ID block ${low}-${high} is exhausted`);
  return { id: `B-${String(next).padStart(3, '0')}`, block: { low, high }, ...(block.reserved ? { reservedBlock: true } : {}) };
}

// A cell value this command writes into a table row. A pipe would split the row, a newline would end it.
function cellText(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${name} must be a non-empty string`);
  if (/[|\n\r]/.test(value)) throw new Error(`${name} may not contain a pipe or a line break — it is written into one table cell`);
  return value.trim();
}

// One atomic write: the Status cell, and — when the caller states them — the provenance marker in the
// Source cell (` · Done by <by>`, ` · Dropped: <reason>`) and the detail section's `**Resolution:**`
// line. Structure only: the command that calls this decided the disposition from its own evidence,
// and nothing here judges whether it was delivered.
export async function setStatus(file, requestedId, status, { by = null, reason = null, resolution = null } = {}) {
  if (!STATUSES.has(status)) throw new Error(`invalid status: ${status}`);
  if (by !== null && status !== 'Done') throw new Error('--by records who delivered the item, so it is accepted with Done only');
  if (reason !== null && status !== 'Dropped') throw new Error('--reason records why the item was dropped, so it is accepted with Dropped only');
  const id = normalizeId(requestedId);
  const { lines, table: parsed, idColumn, statusColumn: parsedStatus } = await backlogTable(file);
  const view = rankView(lines, parsed, idColumn, parsedStatus);
  const { table } = view;
  const statusColumn = table.header.indexOf('Status');
  const matches = view.rows.filter((entry) => entry.id === id);
  if (matches.length !== 1) throw new Error(matches.length === 0 ? `${id} not found` : `${id} appears ${matches.length} times`);
  const match = matches[0];
  const previous = match.row[statusColumn];
  if (!ROW_STATUSES.has(previous) && ROW_STATUSES.has(status)) match.row[view.rankColumn] = String(tailRank(view));
  match.row[statusColumn] = status;
  match.status = status;
  const sourceColumn = table.header.indexOf('Source');
  const marker = by !== null ? ` · Done by ${cellText(by, '--by')}` : reason !== null ? ` · Dropped: ${cellText(reason, '--reason')}` : null;
  if (marker !== null) {
    if (sourceColumn < 0) throw new Error('backlog table has no Source column to record the provenance in');
    const source = match.row[sourceColumn] ?? '';
    if (!source.includes(marker.trim())) match.row[sourceColumn] = `${source}${marker}`.trim();
  }
  lines[match.line] = formatRow(match.row);
  let resolutionWritten = null;
  if (resolution !== null) {
    const text = cellText(resolution, '--resolution');
    const heading = lines.findIndex((line) => new RegExp(`^## ${id}(?![0-9])\\b`).test(line));
    if (heading < 0) {
      // No detail section yet: create the minimal one in the format /esq:backlog already writes — the
      // `## B-NNN — <summary>` heading and the one prose line that closed it — below the `---` that
      // separates the table from the detail sections, adding that separator only when the file has
      // none. A resolution the caller supplied is never dropped because the item had no prose.
      const summaryColumn = table.header.indexOf('Summary');
      const summary = summaryColumn < 0 ? '' : (match.row[summaryColumn] ?? '');
      while (lines.length > 0 && lines.at(-1).trim() === '') lines.pop();
      const separator = lines.slice(table.end).some((line) => line.trim() === '---');
      lines.push(...(separator ? [] : ['', '---']), '', `## ${id} — ${summary}`.trimEnd(), '', `**Resolution:** ${text}`, '');
      resolutionWritten = 'created';
    } else {
      let end = lines.length;
      for (let index = heading + 1; index < lines.length; index += 1) {
        if (/^#{1,2} /.test(lines[index]) || lines[index].trim() === '---') { end = index; break; }
      }
      const existing = lines.slice(heading + 1, end).findIndex((line) => line.startsWith('**Resolution:**'));
      if (existing >= 0) lines[heading + 1 + existing] = `**Resolution:** ${text}`;
      else {
        let insert = end;
        while (insert > heading + 1 && lines[insert - 1].trim() === '') insert -= 1;
        lines.splice(insert, 0, '', `**Resolution:** ${text}`);
      }
      resolutionWritten = 'written';
    }
  }
  clearClosedRanks(view, lines);
  await atomicWrite(file, lines.join('\n'));
  return { id, previous, status, file, ...(marker !== null ? { provenance: marker.replace(/^ · /, '') } : {}), ...(resolutionWritten !== null ? { resolution: resolutionWritten } : {}) };
}

// The priority cell, written by the one verb both `/esq:backlog` and `/esq:roadmap plan` call. A
// trailing `?` is the whole of what separates a level the model suggested from one the user
// confirmed, and `PRI_LADDER` already holds both — so that ladder is the entire vocabulary this
// accepts. A value off it has no position in the sort and inventing one would make the ordering
// fiction (D-cli-owns-structure-model-owns-judgment). Structure only: nothing here decides what an
// item is worth, it records the level its caller decided and refuses a word it cannot order.
export async function setPri(file, requestedId, pri) {
  const value = String(pri ?? '').trim();
  if (!PRI_LADDER.includes(value)) {
    throw new Error(`invalid priority: ${value === '' ? '(empty)' : value} — one of ${PRI_LADDER.join(', ')}, where a trailing \`?\` marks a suggestion and a bare value a confirmed level`);
  }
  const id = normalizeId(requestedId);
  const { lines, table, idColumn } = await backlogTable(file);
  const priColumn = ['Pri', 'Priority'].map((name) => table.header.indexOf(name)).find((index) => index >= 0) ?? -1;
  if (priColumn < 0) throw new Error('backlog table has no Pri column to write the priority into');
  const matches = [];
  table.rows.forEach((row, offset) => {
    if (normalizeId(row[idColumn]) === id) matches.push({ row, line: table.start + 2 + offset });
  });
  if (matches.length !== 1) throw new Error(matches.length === 0 ? `${id} not found` : `${id} appears ${matches.length} times`);
  const match = matches[0];
  const previous = (match.row[priColumn] ?? '').trim();
  match.row[priColumn] = value;
  lines[match.line] = formatRow(match.row);
  await atomicWrite(file, lines.join('\n'));
  return { id, previous, pri: value, confirmed: !value.endsWith('?'), file };
}

// The integers a rank is made of, and they are deliberately sparse. A gap of 100 between two
// neighbours is what lets `esq backlog rank <B-NNN> --after <B-NNN>` give one item a number without
// rewriting either row beside it — the placement `/esq:backlog` does on every capture. Renumbering
// is the fallback for an exhausted gap, never the normal path, and the result says when it happened.
const RANK_STEP = 100;

// One parsed backlog, widened to carry the column and indexed the way both rank modes need it:
// every row with the line it lives on, its normalized id, its status and its current rank. The
// widening runs before a value is written, exactly as `addRow` does it, so a nine-column ledger is
// padded once and every number lands under a header that exists.
function rankView(lines, parsed, idColumn, statusColumn) {
  // The column indices the caller holds were read off the narrow header. Widening inserts a cell in
  // the middle of it, so every index right of `Pri` moves — they are re-read from the header that
  // now exists rather than carried across the write that invalidated them.
  const idHeader = parsed.header[idColumn];
  const statusHeader = parsed.header[statusColumn];
  const table = addRankColumn(lines, parsed);
  idColumn = table.header.indexOf(idHeader);
  statusColumn = table.header.indexOf(statusHeader);
  const rankColumn = table.header.indexOf(RANK_COLUMN);
  const priColumn = ['Pri', 'Priority'].map((name) => table.header.indexOf(name)).find((index) => index >= 0) ?? -1;
  const rows = table.rows.map((row, offset) => ({
    row,
    line: table.start + 2 + offset,
    id: normalizeId(row[idColumn]),
    status: row[statusColumn],
    rank: (row[rankColumn] ?? '').trim(),
  }));
  return { table, rankColumn, priColumn, rows, byId: new Map(rows.map((entry) => [entry.id, entry])) };
}

const isOpenRow = (entry) => ROW_STATUSES.has(entry.status);
const rankNumber = (entry) => (/^\d+$/.test(entry.rank) ? Number(entry.rank) : null);

// Only stored active positions participate. Legacy unranked rows remain unclassified, and a
// closed row's former position is never revived when it reopens.
function tailRank(view) {
  let tail = 0;
  for (const entry of view.rows.filter(isOpenRow)) {
    if (entry.rank === '') continue;
    const rank = rankNumber(entry);
    if (!Number.isSafeInteger(rank)) throw new Error(`${entry.id} carries an invalid rank: ${entry.rank}`);
    tail = Math.max(tail, rank);
  }
  const next = tail + RANK_STEP;
  if (!Number.isSafeInteger(next)) throw new Error('tail rank exceeds the safe integer range — rank the sequence with --order first');
  return next;
}

// Repair retained closed positions in the same atomic write as the requested mutation. Run only
// after refusals: even legacy collisions cannot authorize a partial write on failed input.
function clearClosedRanks(view, lines) {
  let written = 0;
  for (const entry of view.rows) {
    if (!['Done', 'Dropped'].includes(entry.status) || entry.rank === '') continue;
    entry.row[view.rankColumn] = '';
    lines[entry.line] = formatRow(entry.row);
    written += 1;
  }
  return written;
}

// Writes the rows this call actually changed, and nothing else. A cell whose value is unchanged is
// left byte-identical, which is what keeps a single placement out of every other row's history.
async function writeRanks(file, lines, assignments) {
  let written = 0;
  for (const { entry, rank } of assignments) {
    const value = String(rank);
    if (entry.row[entry.rankIndex] === value) continue;
    entry.row[entry.rankIndex] = value;
    lines[entry.line] = formatRow(entry.row);
    written += 1;
  }
  await atomicWrite(file, lines.join('\n'));
  return written;
}

// The roadmap's edges, read beside the backlog rather than from a repository root: `docs/ROADMAP.md`
// is the sibling of the ledger being ranked, which is what lets a worktree, a fixture and the real
// repo all resolve it the same way. `A needs: B` and `B unblocks: A` are one edge stated from either
// end, so both collapse to the same `{before, after}` pair over entry slugs. A named entry that does
// not exist carries no edge — the roadmap's own prose is what would have to be fixed, and inventing
// an ordering from a dangling name is exactly the fiction this file does not commit.
export async function rankEdges(backlogFile) {
  let text;
  try { text = await readText(path.join(path.dirname(backlogFile), 'ROADMAP.md')); }
  catch (error) {
    if (error.code === 'ENOENT') return { entries: new Map(), edges: [] };
    throw error;
  }
  const entries = new Map();
  let current = null;
  for (const line of text.split('\n')) {
    const heading = line.match(/^### (.+?)\s*$/);
    if (heading) {
      const slug = heading[1].trim();
      // One slug stated under two horizons is one entry; its fields merge rather than the later
      // occurrence silently replacing the earlier one's edges.
      current = entries.get(slug) ?? { slug, covers: [], needs: [], unblocks: [] };
      entries.set(slug, current);
      continue;
    }
    if (!current) continue;
    const field = line.match(/^\*\*(covers|needs|unblocks):\*\*\s*(.*)$/);
    if (!field) continue;
    const values = field[2].replace(/<!--.*?-->/g, '').split(',').map((value) => value.trim()).filter(Boolean);
    if (field[1] === 'covers') current.covers.push(...values.filter((value) => /^B-\d+$/.test(value)).map((value) => normalizeId(value)));
    else current[field[1]].push(...values);
  }
  const edges = [];
  const seen = new Set();
  const push = (before, after) => {
    if (before === after || !entries.has(before) || !entries.has(after)) return;
    const key = `${before}\u0000${after}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ before, after });
  };
  for (const entry of entries.values()) {
    for (const slug of entry.needs) push(slug, entry.slug);
    for (const slug of entry.unblocks) push(entry.slug, slug);
  }
  return { entries, edges };
}

// A requested order that contradicts an edge is refused, naming both entries. The two judgments this
// command projects — the priority and the roadmap — are the user's, so when they disagree the answer
// is never for the CLI to pick one: it reports the pair and changes nothing.
function assertRankEdges({ entries, edges }, sequence) {
  const position = new Map(sequence.map((entry, index) => [entry.id, index]));
  const placed = (slug) => entries.get(slug).covers.filter((id) => position.has(id));
  for (const edge of edges) {
    const before = placed(edge.before);
    const after = placed(edge.after);
    if (before.length === 0 || after.length === 0) continue;
    const latest = before.reduce((a, b) => (position.get(a) >= position.get(b) ? a : b));
    const earliest = after.reduce((a, b) => (position.get(a) <= position.get(b) ? a : b));
    if (position.get(latest) > position.get(earliest)) {
      throw new Error(`the requested order puts ${latest} (${edge.before}) after ${earliest} (${edge.after}), and docs/ROADMAP.md records ${edge.before} before ${edge.after} — change the edge or the order, never one behind the other's back`);
    }
  }
}

// The bucket half of a priority: `hi?` and `hi` are the same level, differing only in who said so.
const PRI_LEVELS = ['lo', 'med', 'hi'];
const priLevel = (value) => PRI_LEVELS.indexOf(String(value ?? '').trim().replace(/\?$/, ''));

// An edge promotes, but never silently overrides the user. A blocker sitting a level below what it
// unblocks can never be worked — the `hi` above it is reached first and stalls on it — so a level
// the model merely *suggested* is raised to the one it gates, staying suggested so the user's own
// word still outranks it. A level the user *confirmed* is left exactly as stated and reported as a
// contradiction: silently demoting or promoting a stated priority is the one move that would make
// this ledger untrustworthy.
function promoteForEdges(view, { entries, edges }, lines) {
  if (view.priColumn < 0) return {};
  const promoted = [];
  const contradictions = [];
  const rowsOf = (slug) => entries.get(slug).covers.map((id) => view.byId.get(id)).filter((entry) => entry && isOpenRow(entry));
  for (const edge of edges) {
    const before = rowsOf(edge.before);
    const after = rowsOf(edge.after);
    if (before.length === 0 || after.length === 0) continue;
    const target = Math.max(...after.map((entry) => priLevel(entry.row[view.priColumn])));
    if (target < 0) continue;
    for (const entry of before) {
      const current = (entry.row[view.priColumn] ?? '').trim();
      if (priLevel(current) >= target) continue;
      if (current !== '' && !current.endsWith('?')) {
        contradictions.push(`${entry.id} is confirmed ${current}, below the ${PRI_LEVELS[target]} it gates through ${edge.before} → ${edge.after} — left exactly as stated`);
        continue;
      }
      const raised = `${PRI_LEVELS[target]}?`;
      entry.row[view.priColumn] = raised;
      lines[entry.line] = formatRow(entry.row);
      promoted.push({ id: entry.id, from: current, to: raised, edge: `${edge.before} → ${edge.after}` });
    }
  }
  return { ...(promoted.length > 0 ? { promoted } : {}), ...(contradictions.length > 0 ? { contradictions } : {}) };
}

// Mode one: the whole sequence, decided by a model and handed here as a list. The CLI assigns the
// integers and refuses a list it cannot turn into one total order — the split that
// D-cli-owns-structure-model-owns-judgment draws. Every refusal names what is wrong rather than
// silently ranking part of the backlog, because a half-ranked ledger is worse than an unranked one.
export async function rankOrder(file, requested) {
  if (!Array.isArray(requested) || requested.length === 0) {
    throw new Error('--order takes the whole open sequence and this list is empty — an order naming nothing orders nothing');
  }
  const ids = requested.map((value) => normalizeId(value));
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`${id} appears twice in --order — a sequence names each item exactly once`);
    seen.add(id);
  }
  const { lines, table: parsed, idColumn, statusColumn } = await backlogTable(file);
  const view = rankView(lines, parsed, idColumn, statusColumn);
  const missing = ids.filter((id) => !view.byId.has(id));
  if (missing.length > 0) throw new Error(`${missing.join(', ')} ${missing.length === 1 ? 'matches' : 'match'} no row in the backlog`);
  const closed = ids.filter((id) => !isOpenRow(view.byId.get(id)));
  if (closed.length > 0) throw new Error(`${closed.join(', ')} ${closed.length === 1 ? 'is' : 'are'} not open — a rank orders the work that is still to do`);
  const open = view.rows.filter(isOpenRow);
  const omitted = open.filter((entry) => !seen.has(entry.id)).map((entry) => entry.id);
  if (omitted.length > 0) {
    throw new Error(`--order must name every open row, and ${omitted.length} ${omitted.length === 1 ? 'is' : 'are'} missing: ${omitted.join(', ')}`);
  }
  const sequence = ids.map((id) => view.byId.get(id));
  const roadmap = await rankEdges(file);
  assertRankEdges(roadmap, sequence);
  const promoted = promoteForEdges(view, roadmap, lines);
  const assignments = sequence.map((entry, index) => ({ entry: { ...entry, rankIndex: view.rankColumn }, rank: (index + 1) * RANK_STEP }));
  const cleared = clearClosedRanks(view, lines);
  const written = cleared + await writeRanks(file, lines, assignments);
  return { file, mode: 'order', ranked: assignments.map(({ entry, rank }) => ({ id: entry.id, rank })), written, ...promoted };
}

// Mode two: one item, placed between the neighbours the caller names, touching no other row. The
// sequence it is placed into is the open rows that already carry a number — an unranked row has no
// position to be relative to, and inventing one is the model's call rather than this file's.
export async function rankPlace(file, requestedId, { after = null, before = null, last = false } = {}) {
  const chosen = [after !== null && 'after', before !== null && 'before', last && 'last'].filter(Boolean);
  if (chosen.length !== 1) {
    throw new Error('a placement names exactly one of --after <B-NNN>, --before <B-NNN> or --last');
  }
  const id = normalizeId(requestedId);
  const neighbourId = after !== null ? normalizeId(after) : before !== null ? normalizeId(before) : null;
  if (neighbourId === id) throw new Error(`${id} cannot be placed relative to itself`);
  const { lines, table: parsed, idColumn, statusColumn } = await backlogTable(file);
  const view = rankView(lines, parsed, idColumn, statusColumn);
  for (const candidate of [id, neighbourId].filter(Boolean)) {
    const entry = view.byId.get(candidate);
    if (!entry) throw new Error(`${candidate} matches no row in the backlog`);
    if (!isOpenRow(entry)) throw new Error(`${candidate} is not open — a rank orders the work that is still to do`);
  }
  const target = view.byId.get(id);
  const others = view.rows
    .filter((entry) => isOpenRow(entry) && entry.id !== id && rankNumber(entry) !== null)
    .sort((a, b) => rankNumber(a) - rankNumber(b));
  let index;
  if (last) index = others.length;
  else {
    index = others.findIndex((entry) => entry.id === neighbourId);
    if (index < 0) throw new Error(`${neighbourId} carries no rank yet — place against a ranked row, or rank the sequence with --order first`);
    if (after !== null) index += 1;
  }
  const sequence = [...others.slice(0, index), target, ...others.slice(index)];
  const roadmap = await rankEdges(file);
  assertRankEdges(roadmap, sequence);
  const promoted = promoteForEdges(view, roadmap, lines);
  // A gap wide enough holds the new number on its own; only an exhausted one renumbers, and then the
  // whole sequence is restated at the canonical spacing rather than patched.
  const low = index === 0 ? 0 : rankNumber(others[index - 1]);
  const high = index === others.length ? low + 2 * RANK_STEP : rankNumber(others[index]);
  const midpoint = Math.floor((low + high) / 2);
  const renumbered = !(midpoint > low && midpoint < high);
  const assignments = renumbered
    ? sequence.map((entry, offset) => ({ entry: { ...entry, rankIndex: view.rankColumn }, rank: (offset + 1) * RANK_STEP }))
    : [{ entry: { ...target, rankIndex: view.rankColumn }, rank: midpoint }];
  const cleared = clearClosedRanks(view, lines);
  const written = cleared + await writeRanks(file, lines, assignments);
  const placed = assignments.find(({ entry }) => entry.id === id).rank;
  return { file, mode: 'place', id, rank: placed, renumbered, written, ...promoted };
}

// Files one row, numbered from this working tree's block, in one atomic write. The Source cell is the
// caller's classification, written at filing time: `build: <slug> Phase N` / `fix: <slug>` for a
// defect in the unit's work — its regressions and aggravations included, even in a file it never
// touched — which `unit.open` blocks on, and `observed: <slug> Phase N` for a finding outside the
// promised work the unit neither introduced nor aggravated, which it does not. Nothing here decides
// which one a finding is — and no row is ever re-filed under a different verb to get past a gate.
// What a row is worth before anyone has looked at it. `/esq:build`, `/esq:check` and `/esq:review`
// file rows without a priority, and 40 of this repo's own 51 open rows were unprioritized because of
// it — so a caller that states none gets one derived from the type, always *suggested* (`?`-suffixed)
// so the ladder keeps it below anything a person confirmed and `/esq:roadmap plan` is free to move it.
// Something that breaks, is owed, or is deferred debt starts at `med?`; an improvement or an idea
// starts at `lo?`. The type cell carries its glyph (`🐛 bug`), so the glyph is what is matched.
const TYPE_PRI = [['🐛', 'med?'], ['⚠️', 'med?'], ['☑️', 'med?'], ['✨', 'lo?'], ['💡', 'lo?']];
const DEFAULT_PRI = 'med?';

export function priForType(type) {
  const text = String(type);
  return TYPE_PRI.find(([glyph]) => text.includes(glyph))?.[1] ?? DEFAULT_PRI;
}

export async function addRow(root, file, { type, summary, source, pri = '', epic = '', status = 'Open' }) {
  const fields = { type: cellText(type, '--type'), summary: cellText(summary, '--summary'), source: cellText(source, '--source') };
  if (!STATUSES.has(status)) throw new Error(`invalid status: ${status}`);
  if (pri !== '') cellText(pri, '--pri');
  if (epic !== '') cellText(epic, '--epic');
  const priority = pri !== '' ? pri.trim() : priForType(fields.type);
  const { id, block } = await reserveId(root, file);
  const { lines, table: parsed, idColumn, statusColumn } = await backlogTable(file);
  // The widening happens before a value is written, so a backlog meeting the column for the first
  // time is padded once and the new row is formatted against the header it will actually live under.
  const view = rankView(lines, parsed, idColumn, statusColumn);
  const { table } = view;
  const rank = ROW_STATUSES.has(status) ? String(tailRank(view)) : '';
  const values = { ID: id, '#': id, Date: new Date().toISOString().slice(0, 10), Type: fields.type, Pri: priority, Priority: priority, [RANK_COLUMN]: rank, Summary: fields.summary, Source: fields.source, Epic: epic, Version: '', Status: status };
  const cells = table.header.map((column) => values[column] ?? '');
  clearClosedRanks(view, lines);
  lines.splice(table.end, 0, formatRow(cells));
  await atomicWrite(file, lines.join('\n'));
  return { id, block, file, row: cells };
}

// The execution-log payload contract, as data: one row per accepted key, its type, and what each
// status does with it — `required`, `optional`, or `refused` (legal on the other status only).
// The validator, the renderer's field order and `append-log --help` all read this one object, so a
// key cannot be documented without being accepted or accepted without being documented
// (D-append-log-refuses-an-unknown-key). Order is the order the fields render in.
export const LOG_ENTRY_STATUSES = ['completed', 'paused'];

export const LOG_ENTRY_SCHEMA = [
  { key: 'phase', type: 'integer', label: 'integer >= 1', completed: 'required', paused: 'required' },
  { key: 'status', type: 'enum', label: '"completed" | "paused"', values: LOG_ENTRY_STATUSES, completed: 'required', paused: 'required' },
  { key: 'date', type: 'date', label: 'YYYY-MM-DD string', completed: 'optional', paused: 'optional', note: 'defaults to today' },
  { key: 'planCommittedAt', type: 'string', label: 'non-empty string', completed: 'optional', paused: 'optional', note: 'defaults to "unversioned"' },
  { key: 'commits', type: 'stringOrArray', label: 'string | array of strings', completed: 'required', paused: 'required', note: 'the only key an empty array is legal for; renders "none"' },
  { key: 'verified', type: 'verified', label: '{at, commands}', completed: 'optional', paused: 'optional', note: 'at is the FULL 40-hex commit the (auto) steps ran on; commands are the exact command strings judged PASS. Required whenever the phase names a runnable (auto) command and the entry is either completed or a pause whose only cause is manualOutstanding — the one requirement the phase carries rather than the payload, so it is checked against the plan rather than listed here. A pause naming blockedBy keeps it optional: that one may have stopped before judging its steps' },
  { key: 'reconciled', type: 'string', label: 'non-empty string', completed: 'optional', paused: 'optional', note: 'what an unlogged phase was reconciled from' },
  { key: 'whatBuilt', type: 'string', label: 'non-empty string', completed: 'required', paused: 'required' },
  { key: 'verification', type: 'stringArray', label: 'non-empty array of non-empty strings', completed: 'required', paused: 'required', note: 'on paused these are the (auto) results' },
  { key: 'manualOutstanding', type: 'stringArray', label: 'non-empty array of non-empty strings', completed: 'refused', paused: 'optional', note: 'a paused entry carries this, blockedBy, or both — never neither' },
  { key: 'blockedBy', type: 'stringArray', label: 'non-empty array of non-empty strings', completed: 'refused', paused: 'optional', note: 'the same-unit backlog rows that stopped the phase, as `esq branch check` names them' },
  { key: 'surprises', type: 'string', label: 'non-empty string', completed: 'optional', paused: 'optional' },
  { key: 'backlogCandidates', type: 'string', label: 'non-empty string', completed: 'optional', paused: 'optional' },
  { key: 'forNextPhase', type: 'string', label: 'non-empty string', completed: 'optional', paused: 'refused', note: 'a paused entry writes no hand-off note' },
];

// `append-log --help`, generated from LOG_ENTRY_SCHEMA so the accepted key set and the documented
// one are the same list. The audience is a worker about to write an entry — 60% of the agents that
// call this command first went reading the CLI's source for its payload (B-049) — so it prints prose
// a person or a model reads, not JSON a skill routes off. Reads nothing and writes nothing.
export function renderAppendLogHelp() {
  const requirement = (row, status) => row[status];
  const width = (pick) => Math.max(...LOG_ENTRY_SCHEMA.map((row) => pick(row).length));
  const keyWidth = width((row) => row.key);
  const typeWidth = width((row) => row.label);
  const lines = [
    'usage: esq plan append-log <plan> <json>',
    '',
    'Appends one execution-log entry to <plan>. <json> is a single object with the keys below.',
    'The payload is validated before the plan file is read, so a refusal leaves it byte-identical.',
    '',
    `${'key'.padEnd(keyWidth)}  ${'type'.padEnd(typeWidth)}  completed  paused`,
    `${'-'.repeat(keyWidth)}  ${'-'.repeat(typeWidth)}  ---------  --------`,
  ];
  for (const row of LOG_ENTRY_SCHEMA) {
    lines.push(`${row.key.padEnd(keyWidth)}  ${row.label.padEnd(typeWidth)}  ${requirement(row, 'completed').padEnd(9)}  ${requirement(row, 'paused')}`);
    if (row.note) lines.push(`${' '.repeat(keyWidth + 2)}  ${row.note}`);
  }
  lines.push(
    '',
    '`refused` means the key is legal on the other status only.',
    'Any key not listed is refused, naming itself and the accepted set.',
    'null is never a way to omit a key — omit the key instead.',
    'A required string must be non-empty; a required array must be non-empty and hold non-empty strings.',
    '',
  );
  return lines.join('\n');
}

// The provenance half of `verified`: which tree the `(auto)` steps were judged on, and which
// commands were judged PASS on it. `at` is an immutable object id and nothing else — `main`, `HEAD`,
// a tag or an abbreviated hash can all name a different tree tomorrow, so a name that can move is
// refused at append time rather than stored as evidence. PASS, not exit 0: this repo deliberately
// accepts expected non-zero results (a `grep` proving no matches passes at exit 1), so what is
// recorded is the judgement the phase already made, and a step judged red never enters the block.
const VERIFIED_KEYS = ['at', 'commands'];
const FULL_OID = /^[0-9a-f]{40}$/;

function validateVerified(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('log entry key "verified" must be an object {at, commands}');
  for (const key of Object.keys(value)) {
    if (!VERIFIED_KEYS.includes(key)) throw new Error(`verified key "${key}" is not accepted; verified takes {at, commands}`);
  }
  if (typeof value.at !== 'string' || !FULL_OID.test(value.at)) {
    throw new Error('verified.at must be the full 40-character commit object id `git rev-parse HEAD` returned — a ref that can move (main, HEAD, a tag, an abbreviated hash) is a name, not provenance');
  }
  if (!Array.isArray(value.commands) || value.commands.length === 0 || !value.commands.every(fieldText)) {
    throw new Error('verified.commands must be a non-empty array of the exact command strings whose complete (auto) step was judged PASS');
  }
  // Each command renders as one inline-code span and is parsed back out of it, so a backtick or a
  // newline in the value would break the round trip the gate reads.
  const offender = value.commands.find((command) => command.includes('`') || command.includes('\n'));
  if (offender !== undefined) throw new Error(`verified command ${JSON.stringify(offender)} may not contain a backtick or a newline — each renders as one inline-code span`);
}

// A field value is interpolated straight into markdown that `parsePlan` and `nextPhase` read
// structurally, so a value that opens a heading or a bold field line does
// not just look wrong — it forges log structure. `whatBuilt` carrying `\n### Phase 2 — completed`
// made `nextPhase` report the phase after it as ready, with that phase never built, and an injected
// `**Assurance escalation:**` line raised the lane one-way. Plain `\n- ` bullets stay legal: the
// completed template renders `**Surprises …:**` as a bullet list.
const STRUCTURAL_LINE = /^[ \t]*(#{1,6}[ \t]|\*\*)/m;

const fieldText = (value) => typeof value === 'string' && value.trim() !== '' && !STRUCTURAL_LINE.test(value);

// One predicate per `type` in LOG_ENTRY_SCHEMA. `stringOrArray` accepts an empty array because
// `commits` is the one key an empty one is legal for, and the renderer turns it into `none`.
const LOG_ENTRY_CHECKS = {
  integer: (value) => Number.isInteger(value) && value >= 1,
  enum: (value, row) => row.values.includes(value),
  date: (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value),
  string: fieldText,
  stringOrArray: (value) => fieldText(value) || (Array.isArray(value) && value.every(fieldText)),
  stringArray: (value) => Array.isArray(value) && value.length > 0 && value.every(fieldText),
};

// A structural-line refusal must say so: the value is a perfectly good non-empty string, so the
// generic type message would send the caller looking for an emptiness that is not there.
const STRUCTURAL_REFUSAL = 'may not open a markdown heading or a bold field line — the execution log\'s structure is parsed from those';

function structuralOffender(value) {
  if (typeof value === 'string') return STRUCTURAL_LINE.test(value);
  return Array.isArray(value) && value.some((item) => typeof item === 'string' && STRUCTURAL_LINE.test(item));
}

// A refusal is read by a worker that has just lost a call, so it carries the three things that
// save it a second one: the offending key, the set accepted for the status it asked for, and where
// the types are. The set is derived from the schema, so it cannot list a key the validator refuses.
function acceptedOn(status) {
  return LOG_ENTRY_SCHEMA.filter((row) => row[status] !== 'refused').map((row) => row.key).join(', ');
}

function refuse(message, status) {
  throw new Error(`${message} — accepted on a ${status} entry: ${acceptedOn(status)}. \`esq plan append-log --help\` prints the types.`);
}

// The whole of the payload contract, checked against LOG_ENTRY_SCHEMA and nothing else. Called by
// `appendLog` **before** it reads the plan file, so every refusal below leaves the target
// byte-identical (D-append-log-refuses-an-unknown-key). The refusals that need the file — an
// unknown phase number, a duplicate entry, a missing log section — necessarily stay after the read.
export function validateLogEntry(entry) {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('log payload must be a JSON object');
  const { status } = entry;
  if (!LOG_ENTRY_STATUSES.includes(status)) {
    const given = status === undefined ? 'nothing' : JSON.stringify(status);
    throw new Error(`log entry status must be "completed" or "paused", not ${given} — every other key's requirement is read from it. \`esq plan append-log --help\` prints them.`);
  }
  const known = new Set(LOG_ENTRY_SCHEMA.map((row) => row.key));
  for (const key of Object.keys(entry)) {
    if (!known.has(key)) refuse(`log entry key "${key}" is not accepted`, status);
  }
  for (const row of LOG_ENTRY_SCHEMA) {
    const present = Object.hasOwn(entry, row.key);
    const value = entry[row.key];
    // `null` is never a way to omit a key — it would otherwise reach the renderer as a falsy value
    // and drop the field silently, which is the hollow entry this refusal exists to stop.
    if (present && value === null) refuse(`log entry key "${row.key}" is null; omit the key instead`, status);
    if (!present) {
      if (row[status] === 'required') refuse(`log entry key "${row.key}" is required on a ${status} entry`, status);
      continue;
    }
    if (row[status] === 'refused') refuse(`log entry key "${row.key}" is not accepted on a ${status} entry`, status);
    else if (row.type === 'verified') validateVerified(value);
    else if (!LOG_ENTRY_CHECKS[row.type](value, row)) {
      if (structuralOffender(value)) refuse(`log entry key "${row.key}" ${STRUCTURAL_REFUSAL}`, status);
      refuse(`log entry key "${row.key}" must be ${row.label}`, status);
    }
  }
  // A pause has two causes and must name one of them. `manualOutstanding` used to be `required`,
  // which is the whole of the reason it could not also express the second cause; relaxing it to
  // optional without this would let a paused entry say nothing about why it paused.
  if (status === 'paused' && !Object.hasOwn(entry, 'manualOutstanding') && !Object.hasOwn(entry, 'blockedBy')) {
    refuse('a paused entry must carry "manualOutstanding" (steps a human must observe) or "blockedBy" (the same-unit defects that stopped it), or both', status);
  }
  return entry;
}

function renderLogEntry(entry) {
  // Every guard this function used to carry now lives in `validateLogEntry`, which runs before the
  // plan file is read — the only caller is `appendLog`, and it validates first.
  const phase = entry.phase;
  const date = entry.date || new Date().toISOString().slice(0, 10);
  // Two paused clauses now, and the glyph is what every consumer routes on. A phase that is both
  // blocked and unobserved reads as blocked: the defect is what has to be disposed of first, and the
  // manual steps are still listed below.
  const pausedClause = entry.blockedBy ? 'blocked on an open same-unit defect' : 'awaiting manual verification';
  const heading = entry.status === 'completed'
    ? `### Phase ${phase} — completed ${date}`
    : `### Phase ${phase} — ⏸ ${pausedClause} (${date})`;
  // An empty array is legal for `commits` and only for `commits` — a phase can land without one —
  // and it renders `none` rather than an empty field, which is what the schema's note promises.
  const commits = Array.isArray(entry.commits) ? (entry.commits.join(', ') || 'none') : (entry.commits || 'none');
  const verification = Array.isArray(entry.verification) ? entry.verification : [];
  const lines = [heading, '', `**Plan committed at:** ${entry.planCommittedAt || 'unversioned'}`, '', `**Commits:** ${commits}`, ''];
  // The provenance block, read back by `esq gate verify`: the tree the `(auto)` steps ran on, then
  // one inline-code span per command judged PASS on it.
  if (entry.verified) {
    lines.push(`**Verified:** ${entry.verified.at}`, ...entry.verified.commands.map((command) => `- \`${command}\``), '');
  }
  if (entry.reconciled) lines.push(`**Reconciled:** ${entry.reconciled}`, '');
  if (entry.whatBuilt) lines.push(`**What got built:** ${entry.whatBuilt}`, '');
  // A paused entry's results are the `(auto)` steps only, which is what build/SKILL.md's paused
  // template has always called them; the completed heading stays `**Verification:**`.
  lines.push(entry.status === 'paused' ? '**Auto verification:**' : '**Verification:**');
  lines.push(...(verification.length ? verification.map((item) => `- ${item}`) : ['- Not recorded.']));
  if (entry.status === 'paused') {
    if (entry.blockedBy) lines.push('', '**Blocked by:**', ...entry.blockedBy.map((item) => `- ${item}`));
    if (entry.manualOutstanding) lines.push('', '**Manual verification outstanding:**', ...entry.manualOutstanding.map((item) => `- ${item}`));
  }
  if (entry.surprises) lines.push('', `**Surprises / decisions made during execution:** ${entry.surprises}`);
  if (entry.backlogCandidates) lines.push('', `**Backlog candidates:** ${entry.backlogCandidates}`);
  if (entry.forNextPhase) lines.push('', `**For Phase ${phase + 1}:** ${entry.forNextPhase}`);
  return lines.join('\n');
}

export async function appendLog(file, json) {
  let entry;
  try { entry = JSON.parse(json); } catch { throw new Error('log payload is not valid JSON'); }
  // Schema first, and only then the file: a refused payload never opens the plan, so the target is
  // byte-identical after every refusal above this line.
  validateLogEntry(entry);
  // The gate. A `completed` entry is a claim that the phase left nothing behind, and a 🐛/⚠️ row this
  // shipping unit filed against its own code and never disposed of is exactly the thing it left
  // behind. Refused before the plan file is read, so the target is byte-identical after it, like
  // every other refusal above this line. The disposition that releases it is a human's, recorded
  // through /esq:backlog: `Done` for fixed, `Dropped` for deliberately accepted.
  if (entry.status === 'completed') {
    const unit = await unitForPlan(file);
    if (unit.open.length > 0) {
      const rows = unit.open.map((row) => `${row.id} (${row.type}, ${row.status})`).join(', ');
      throw new Error(`Phase ${entry.phase} cannot log completed: ${unit.open.length === 1 ? 'a defect' : 'defects'} this shipping unit filed against its own code stands undisposed — ${rows}. Close each through /esq:backlog (\`Done\` when fixed, \`Dropped\` with its reason when deliberately accepted), or pause this phase with "blockedBy" naming them. The plan file is unchanged.`);
    }
  }
  const text = await readText(file);
  const plan = parsePlan(text);
  if (plan.logIndex < 0) throw new Error('plan has no ## Execution log section');
  const phase = Number(entry.phase);
  if (!plan.phases.some((candidate) => candidate.number === phase)) throw new Error(`plan has no Phase ${phase}`);
  if (plan.entries.has(phase)) throw new Error(`Phase ${phase} already has an execution-log entry`);
  // The provenance the landing gate reads back. By the time a phase whose verification list names a
  // runnable `(auto)` command logs `completed`, it has judged that command PASS on a tree — and
  // recording which tree costs one `git rev-parse HEAD` here, against a full re-run of the command at
  // landing, which is exactly what `gate verify` answers `run` for when it finds no block (B-137). So
  // the omission is refused while the worker still holds the evidence, rather than accepted in silence
  // and paid for a session later. The block is required, never its contents: build/SKILL.md's two
  // substitution exceptions mean the command honestly run may differ from the one the plan names, so
  // nothing here compares the two lists, runs a command, or reads an exit code — it asks for a
  // judgement already made.
  //
  // The one pause that owes the block as surely as a completed entry does. A pause whose only cause
  // is `manualOutstanding` is written by a phase that committed its code and judged every `(auto)`
  // step PASS — build/SKILL.md logs nothing at all for a red one, and a phase that also hit a
  // same-unit defect pauses under `blockedBy` instead — so the evidence is in the worker's hands at
  // exactly this call, and the pause that drops it is the one `esq plan resolve-block` later completes
  // with nothing to hand forward (B-152, D-a-manual-pause-records-what-proved-it). `blockedBy` keeps
  // the block optional, unchanged: that pause may genuinely have stopped before judging its steps.
  // Read-only, like every refusal above it — the file is unchanged.
  const owesProvenance = !entry.verified && (entry.status === 'completed'
    || (Object.hasOwn(entry, 'manualOutstanding') && !Object.hasOwn(entry, 'blockedBy')));
  if (owesProvenance) {
    const named = [...new Set(autoSteps(text).filter((step) => step.phase === phase).map((step) => extractAutoCommand(step.step)).filter((command) => command !== null))];
    if (named.length > 0) {
      const one = named.length === 1;
      const list = named.map((command) => `\`${command}\``).join(', ');
      const cost = entry.status === 'completed'
        ? `an entry omitting the block sends the landing gate back to running ${one ? 'it' : 'them'} over the tree ${one ? 'it was' : 'they were'} already judged green on`
        : `a pause omitting the block is resolved later by \`esq plan resolve-block\`, which can only spend the evidence the entry recorded — so the run that confirms your (manual) steps pays to re-run ${one ? 'a command' : 'commands'} this phase has already judged green`;
      const out = entry.status === 'completed'
        ? 'which means this phase is not completed'
        : 'which means this phase is not paused for (manual) steps alone — file the unrunnable step as a backlog row and pause on it with "blockedBy", where the block stays optional';
      throw new Error(`Phase ${phase} cannot log ${entry.status} without its verified provenance: its verification names ${one ? 'the (auto) command' : 'the (auto) commands'} ${list}, and ${cost}. Add "verified": {"at": "<the full 40-character commit \`git rev-parse HEAD\` returns>", "commands": [...]}, naming every command whose complete (auto) step you judged PASS on this tree — the command you actually ran where you substituted one, and nothing at all for a step you judged \u274c or \u26a0\ufe0f, ${out}. The plan file is unchanged.`);
    }
  }
  const block = renderLogEntry(entry);
  const before = plan.lines.slice(0, plan.logEnd);
  const after = plan.lines.slice(plan.logEnd);
  while (before.at(-1) === '') before.pop();
  const lines = [...before, '', block, ''];
  if (after.length) lines.push(...after);
  await atomicWrite(file, lines.join('\n'));
  return { file, phase, status: entry.status };
}

// ── Resolving a pause, under either of its clauses ───────────────────────────
// A pause has two causes and this owns the transition out of both. `⏸ blocked on an open same-unit
// defect` is settled by a `Status` cell changing, which is a fact this process reads directly.
// `⏸ awaiting manual verification` is settled by a human or an instrument looking at a screen, which
// is a fact that never existed in this process — so /esq:build still owns the observing, and hands
// the result here as one `manual` entry per outstanding step. What both have in common is the part
// that was being lost: the phase's own `(auto)` proof, recorded at the pause and spent here rather
// than re-bought (B-152). Either way the transition is a deterministic CLI operation rather than a
// skill rewriting Markdown by hand, and every way it can go wrong is a refusal that leaves the plan
// file byte-identical.
//
// AN OBSERVATION IS NEVER INFERRED. No `(auto)` result, and nothing this process can read, stands in
// for a `(manual)` step: the steps are settled only by observations the caller passes, one per step,
// and a step left out is a step judged FAIL — which is exactly what keeps the pause standing.
//
// TWO CALLS, AND THE SPLIT IS THE WHOLE INTERRUPTION STORY. The read call recomputes the unit, names
// what is still open, and answers which of the phase's own `(auto)` commands git can still prove
// green; it writes nothing, so it is repeatable at any point and after any interruption. The
// `--confirm` call re-derives every one of those facts from the tree it is standing in — never from
// what the read call reported — and only then rewrites the entry, in one `atomicWrite`. Interrupted
// after the backlog disposition, during verification, after the observation or before the write: the
// plan is unchanged and running the pair again costs the reruns and nothing else — never a second
// observation of a step already settled, because nothing was written. Interrupted after the write:
// the entry is resolved, and this verb refuses to touch it again. Neither call re-runs a phase task —
// the commits are already in the tree, and nothing here reads the task list at all.
//
// It judges no severity and closes no row: `/esq:backlog` stays the only writer of a `Status` cell,
// and what this reads back is the disposition a human already recorded
// (D-cli-owns-structure-model-owns-judgment, D-a-same-unit-defect-is-never-a-backlog-row).

const PAUSE_BLOCKED = 'blocked on an open same-unit defect';
const PAUSE_MANUAL = 'awaiting manual verification';
// Every `**Blocked by:**` line names its row first, because `esq branch check`'s `unit.open` is what
// wrote it. A line that names none is an entry nobody can resolve mechanically, and it is refused
// rather than guessed at.
const BLOCKER_ID = /^(B-\d+)\b/;
// `/esq:backlog` writes a disposition's reason into the Source cell behind the word:
// `build: <slug> Phase 2 · Dropped: duplicate of B-110`. Read back so the resolved history carries
// why a row was accepted rather than fixed — which is the half a bare `Dropped` loses.
const DISPOSITION_REASON = /\b(?:Done|Dropped):\s*([^·|]+)/;
const RESOLVE_KEYS = ['phase', 'verified', 'verification', 'manual'];
const MANUAL_KEYS = ['step', 'observed'];

// The lines one execution-log entry occupies: its heading through the line before the next `### `
// heading inside the log span, or the end of that span.
function logEntrySpan(plan, phase) {
  const entry = plan.entries.get(phase);
  if (!entry) return null;
  const start = entry.line - 1;
  let end = plan.logEnd;
  for (let index = start + 1; index < plan.logEnd; index += 1) {
    if (/^### /.test(plan.lines[index])) { end = index; break; }
  }
  return { entry, start, end };
}

// One `**Label:**` field inside an entry body, with the `- ` bullets that follow it. The resolved
// history is written under `**Blocked by (resolved):**` — a different label on purpose, so an entry
// this verb has already resolved can never match `Blocked by` a second time. `**Manual verification
// outstanding:**` becomes `**Manual verification:**` for the same reason, and neither label is a
// prefix of the other, so the lookup cannot cross them.
function entryField(body, label) {
  const head = `**${label}:**`;
  for (let index = 0; index < body.length; index += 1) {
    if (!body[index].startsWith(head)) continue;
    let last = index;
    while (last + 1 < body.length && body[last + 1].startsWith('- ')) last += 1;
    return { line: index, last, items: body.slice(index + 1, last + 1).map((item) => item.slice(2)) };
  }
  return null;
}

// ── The plan context `/esq:build` reads in one response ──────────────────────
// `esq next-phase --context` answers the classification *and* the source text the phase agent would
// otherwise fetch in a second, dependent stage: the skeleton grep names `L` and `A`, and only then
// can the slice reads that depend on them be issued. Every boundary that grep yields is one
// `parsePlan` already computed, so this returns the selected text rather than making the caller
// re-derive where to look (B-161). It narrows nothing further than the procedure it replaces
// (D-narrow-the-read-not-the-plan-file): the same appendix and the same two log slices, and the
// same plan section on every log carrying the append anchor. On an anchorless log the boundary
// below differs on purpose — the fallback's flat `1 → L+1` eats the first entry's heading, which
// the CLI leaves with its own entry (D-the-plan-slice-stops-before-an-entry-heading).
//
// Read-only, and deliberately not a projection: the text is copied out of `plan.lines` verbatim, so
// a JSON round trip reproduces the source exactly. The raw `lines` array and every unselected entry
// body stay out — carrying them back would restore the whole-log read this route exists to avoid.

// The sections, in document order, with 1-based inclusive `from`/`to` ranges into the plan file. A
// later section is trimmed against the one before it rather than allowed to repeat its lines, so no
// byte of the file is delivered twice however the headings happen to sit.
function contextSections(plan, pausedNumber) {
  const { lines, logIndex } = plan;
  const eof = fileLines(plan);
  const logEnd = Math.min(plan.logEnd, eof);
  const slice = (from0, to0) => lines.slice(from0, to0 + 1).join('\n');
  const sections = [];
  if (logIndex < 0) {
    // No `## Execution log` marker: today's contract is to read the whole file, and it still is.
    sections.push({ kind: 'plan', from: 1, to: eof, text: slice(0, eof - 1) });
    return sections;
  }
  // `1 → L`, extended by exactly one further line so the reserved append-anchor comment is in hand
  // — including on the empty log every plan's Phase 1 reads. Two conditions, and both are refusals
  // to eat a line that belongs to someone else: the line has to lie inside the log span (a plan
  // whose appendix starts immediately after the heading has no anchor to carry, and the appendix
  // below owns those lines), and it must not open a `### ` entry heading. `esq plan append-log`
  // does not require the anchor comment, so on an anchorless log line `L+1` is the first entry's
  // own heading — the line that carries its `⏸` clause, and the whole of a heading-only entry.
  const anchor = logIndex + 1;
  const carries = anchor <= logEnd - 1 && !/^### /.test(lines[anchor] ?? '');
  const planEnd = carries ? anchor : logIndex;
  sections.push({ kind: 'plan', from: 1, to: planEnd + 1, text: slice(0, planEnd) });

  // The two slices the route reads: the newest entry, and the `⏸` entry the pause priority needs
  // when it sits outside it. When the pause *is* the newest entry there is one section carrying
  // both roles — an overlap is never delivered twice.
  //
  // The pause is **the one this response already classified**, handed in by the caller from
  // `nextPhase`, never re-derived here. A walk of the log's insertion order disagrees with
  // `nextPhase`'s walk of the plan's phases the moment a log is appended out of phase order: on such
  // a plan the old code answered `state: paused, phase 1` at the top level and shipped Phase 2's body
  // underneath it, with Phase 1's body nowhere in the response. One classification, one selected
  // pause — and `resolveBlock`'s read path asks `nextPhase` the same question (B-164).
  const entries = [...plan.entries.values()];
  const newest = entries.length ? entries[entries.length - 1].number : null;
  const paused = pausedNumber;
  const wanted = new Map();
  if (paused !== null) wanted.set(paused, ['paused']);
  if (newest !== null) wanted.set(newest, [...(wanted.get(newest) ?? []), 'newest'].sort());
  const selected = [];
  for (const [number, roles] of wanted) {
    const span = logEntrySpan(plan, number);
    if (!span) continue;
    const start = Math.max(span.start, planEnd + 1);
    const stop = Math.min(span.end, eof);
    if (start >= stop) continue;
    selected.push({ kind: 'entry', phase: number, status: span.entry.status, roles, from: start + 1, to: stop, text: slice(start, stop - 1) });
  }
  // Document order, read off the file rather than off the phase numbers: the log is appended to in
  // execution order, and a plan whose phases were built out of order still reads top to bottom.
  selected.sort((a, b) => a.from - b.from);
  sections.push(...selected);

  // Whatever starts at `A` is plan material the phases cite, not log, and it comes back in full.
  if (logEnd < eof) sections.push({ kind: 'appendix', from: logEnd + 1, to: eof, text: slice(logEnd, eof - 1) });
  return sections;
}

// The file's own last line. `parsePlan` splits on '\n', so a newline-terminated file yields one
// trailing empty element that is not a line anybody can `sed -n` — every range below stops short of
// it, which is what keeps a `from`/`to` pair and the text it labels describing the same thing.
function fileLines(plan) {
  const { lines } = plan;
  return lines.length - (lines.length > 0 && lines[lines.length - 1] === '' ? 1 : 0);
}

export function planContext(plan, next) {
  const { logIndex } = plan;
  // The classification this same response carries. It is an argument rather than a second call so
  // that the context can never describe a different phase than the verdict above it.
  if (next === null || typeof next !== 'object') throw new Error('planContext requires the nextPhase verdict this context accompanies');
  const pausedNumber = next.state === 'paused' ? next.entry.number : null;
  const eof = fileLines(plan);
  const logEnd = Math.min(plan.logEnd, eof);
  // `context.phases` is the phase list and the top-level `phases` a `complete` verdict already
  // prints is its count — different keys at different levels, and the nesting is what keeps the
  // unflagged output untouched.
  const phases = plan.phases.map((phase) => ({ ...phase, status: plan.entries.get(phase.number)?.status ?? null }));
  return {
    phases,
    completed: phases.filter((phase) => phase.status === 'completed').length,
    log: {
      line: logIndex < 0 ? null : logIndex + 1,
      end: logIndex < 0 ? null : logEnd,
      appendix: logIndex < 0 || logEnd >= eof ? null : logEnd + 1,
    },
    sections: contextSections(plan, pausedNumber),
  };
}

// One observation per outstanding step: which step, and what was actually seen. A step judged FAIL is
// a step this array omits — nothing about a red is inferred, its absence is the evidence — which is
// the same idiom `verified.commands` uses for a red `(auto)` command, held here so a run settling
// both halves of a pause states them the same way.
function validateManual(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('--confirm key "manual" must be a non-empty array of {step, observed} — one observation per step the entry lists under **Manual verification outstanding:**');
  }
  for (const item of value) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) throw new Error('--confirm key "manual" takes objects {step, observed}');
    for (const key of Object.keys(item)) {
      if (!MANUAL_KEYS.includes(key)) throw new Error(`--confirm manual key "${key}" is not accepted; each observation takes {step, observed}`);
    }
    if (!fieldText(item.step)) {
      throw new Error(structuralOffender(item.step) ? `--confirm manual "step" ${STRUCTURAL_REFUSAL}` : '--confirm manual "step" must be one outstanding step, copied exactly as the entry lists it');
    }
    if (!fieldText(item.observed)) {
      throw new Error(structuralOffender(item.observed) ? `--confirm manual "observed" ${STRUCTURAL_REFUSAL}` : '--confirm manual "observed" must be what you actually saw, naming the instrument that saw it — never a restatement of the step');
    }
  }
}

function validateResolvePayload(json) {
  let payload;
  try { payload = JSON.parse(json); } catch { throw new Error('--confirm payload is not valid JSON'); }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('--confirm payload must be a JSON object');
  for (const key of Object.keys(payload)) {
    if (!RESOLVE_KEYS.includes(key)) throw new Error(`--confirm key "${key}" is not accepted; it takes ${RESOLVE_KEYS.join(', ')}`);
  }
  if (!Number.isInteger(payload.phase) || payload.phase < 1) throw new Error('--confirm requires "phase": the integer phase whose pause is being resolved, so an interrupted run can never resolve a different entry than the one it read');
  if (Object.hasOwn(payload, 'verified')) validateVerified(payload.verified);
  if (Object.hasOwn(payload, 'manual')) validateManual(payload.manual);
  if (Object.hasOwn(payload, 'verification')) {
    const value = payload.verification;
    if (!Array.isArray(value) || value.length === 0 || !value.every(fieldText)) throw new Error('--confirm key "verification" must be a non-empty array of non-empty strings — one (auto) result line per command this resolution re-ran');
    if (structuralOffender(value)) throw new Error(`--confirm key "verification" ${STRUCTURAL_REFUSAL}`);
  }
  return payload;
}

export async function resolveBlock(root, planPath, confirmJson = null) {
  // The payload is validated before the plan file is opened, exactly as `append-log`'s is.
  const payload = confirmJson === null ? null : validateResolvePayload(confirmJson);
  const file = path.resolve(root, planPath);
  const relative = path.relative(root, file) || planPath;
  const decline = (code, reason, extra = {}) => ({ file: relative, phase: payload?.phase ?? null, refuse: true, code, reason, ...extra });

  const text = await readText(file);
  const plan = parsePlan(text);
  if (plan.logIndex < 0) return decline('malformed-entry', `${relative} has no ## Execution log section, so it carries no pause to resolve. The plan file is unchanged.`);

  // A confirmation resolves the phase it names, checked below rather than trusted. A read names the
  // pause `/esq:build` would settle, so it asks `nextPhase` — never a second walk of the log, whose
  // insertion order disagrees with phase order the moment two pauses were appended out of it (B-164).
  let phase = payload ? payload.phase : null;
  if (!payload) {
    let verdict;
    try { verdict = nextPhase(plan); }
    catch (error) { return decline('malformed-entry', `${relative} cannot be classified: ${error.message}. The plan file is unchanged.`); }
    phase = verdict.state === 'paused' ? verdict.phase.number : null;
  }
  if (phase === null) return decline('no-blocked-entry', `${relative} carries no \`⏸\` entry — there is nothing for this verb to resolve. The plan file is unchanged.`);
  const span = logEntrySpan(plan, phase);
  if (!span) return decline('no-blocked-entry', `Phase ${phase} has no execution-log entry. The plan file is unchanged.`, { phase });
  if (span.entry.status === 'completed') return decline('already-resolved', `Phase ${phase} already reads completed — this resolution has run, and re-running it changes nothing. The plan file is unchanged.`, { phase });

  // The clause, read off the heading the renderer wrote. The glyph made it paused
  // (D-a-pause-is-classified-by-its-glyph); this only decides which of the two facts has to be
  // settled, and the entry's own fields are what carry each of them.
  const clause = span.entry.heading.includes(PAUSE_BLOCKED) ? 'blocked' : 'manual';

  const body = plan.lines.slice(span.start, span.end);
  const blockedField = entryField(body, 'Blocked by');
  // `**Verification:**` is the label a paused entry carried before 6c4bbe8 (2026-08-22) renamed it, and
  // a manual pause is the one clause old enough to still be holding one. Neither label is a prefix of
  // the other, so the fallback cannot cross-match; the rewrite below relabels to `**Verification:**`
  // on the way to completed anyway, which is where an entry of either vintage ends up.
  const autoField = entryField(body, 'Auto verification') ?? entryField(body, 'Verification');
  const manualField = entryField(body, 'Manual verification outstanding');
  if (!autoField) {
    return decline('malformed-entry', `Phase ${phase}'s entry carries no \`**Auto verification:**\` list, so there is no verification record to carry into a completed entry. The plan file is unchanged.`, { phase });
  }
  if (clause === 'manual' && (!manualField || manualField.items.length === 0)) {
    return decline('malformed-entry', `Phase ${phase}'s entry is headed \`⏸ ${PAUSE_MANUAL}\` but carries no \`**Manual verification outstanding:**\` list, so the steps it is waiting on cannot be read. The plan file is unchanged.`, { phase });
  }

  // The entry's own record of what stopped it. Refused rather than repaired: an entry headed blocked
  // that cannot say which rows blocked it is one no mechanical transition can honestly resolve.
  const ids = [];
  if (clause === 'blocked') {
    if (!blockedField || blockedField.items.length === 0) {
      return decline('malformed-entry', `Phase ${phase}'s entry is headed \`⏸ ${PAUSE_BLOCKED}\` but carries no \`**Blocked by:**\` list, so the rows it paused on cannot be read. The plan file is unchanged.`, { phase });
    }
    for (const item of blockedField.items) {
      const match = BLOCKER_ID.exec(item);
      if (!match) return decline('malformed-entry', `Phase ${phase}'s \`**Blocked by:**\` list carries a line naming no backlog id: ${JSON.stringify(item)}. Every blocker is a \`B-NNN\` row. The plan file is unchanged.`, { phase });
      ids.push(match[1]);
    }
  }

  // Recomputed here, from the ledger as it stands now — never from what the read call reported, and
  // never from the entry. A blocker filed *since* the pause blocks the same way the named ones do,
  // and it holds a manual pause exactly as it holds a blocked one: a phase whose unit owes an
  // undisposed defect is not a phase an observation can complete.
  const unit = await unitForPlan(file, text);
  if (unit.open.length > 0) {
    const rows = unit.open.map((row) => `${row.id} (${row.type}, ${row.status})`).join(', ');
    return decline('blockers-open', `Phase ${phase} stays paused: ${unit.open.length === 1 ? 'a defect' : 'defects'} this shipping unit filed against its own code still stands undisposed — ${rows}. Set each \`Done\` (fixed) or \`Dropped\` (deliberately accepted, with its reason) through /esq:backlog, then run this again. The plan file is unchanged.`, { phase, unitOpen: unit.open });
  }

  const dispositions = [];
  if (clause === 'blocked') {
    const repository = path.resolve(path.dirname(file), '../..');
    let ledger;
    try { ledger = await backlogTable(path.join(repository, 'docs/BACKLOG.md')); }
    catch { ledger = null; }
    if (!ledger) {
      return decline('blocker-missing', `docs/BACKLOG.md could not be read, so the disposition of ${ids.join(', ')} cannot be recorded as history. The plan file is unchanged.`, { phase });
    }
    const column = (name) => ledger.table.header.indexOf(name);
    const typeColumn = column('Type');
    const sourceColumn = column('Source');
    const summaryColumn = column('Summary');
    const rows = new Map(ledger.table.rows.map((row) => [row[ledger.idColumn] ?? '', row]));
    for (const id of ids) {
      const row = rows.get(id);
      if (!row) {
        return decline('blocker-missing', `${id} is no longer a row in docs/BACKLOG.md — a blocker is disposed of through /esq:backlog, never by deleting the row that records it. The plan file is unchanged.`, { phase });
      }
      const status = row[ledger.statusColumn] ?? '';
      if (!UNIT_DISPOSED.has(status)) {
        return decline('blockers-open', `${id} still reads \`${status || 'nothing'}\` — set it \`Done\` (fixed) or \`Dropped\` (deliberately accepted, with its reason) through /esq:backlog. The plan file is unchanged.`, { phase });
      }
      const source = sourceColumn < 0 ? '' : String(row[sourceColumn] ?? '');
      dispositions.push({
        id,
        type: typeColumn < 0 ? null : unitType(row[typeColumn]),
        status,
        reason: (DISPOSITION_REASON.exec(source)?.[1] ?? '').trim() || null,
        summary: summaryColumn < 0 ? '' : String(row[summaryColumn] ?? ''),
      });
    }
  }

  // The observations, checked against the list the entry itself carries. Exact strings both ways: a
  // step the payload does not name is a step judged FAIL or never looked at, and either way the pause
  // stands; a step the payload names that the entry does not list is a typo or an invention, and
  // accepting it would let an observation settle a step nobody was owed.
  const outstanding = manualField ? manualField.items : [];
  const observations = payload && Object.hasOwn(payload, 'manual') ? payload.manual : null;
  if (observations) {
    const named = observations.map((item) => item.step);
    const duplicated = named.filter((step, index) => named.indexOf(step) !== index);
    const unknown = named.filter((step) => !outstanding.includes(step));
    const missing = outstanding.filter((step) => !named.includes(step));
    if (duplicated.length > 0 || unknown.length > 0 || missing.length > 0) {
      const parts = [];
      if (missing.length > 0) parts.push(`${missing.length === 1 ? 'this step is' : 'these steps are'} unsettled — ${missing.map((step) => JSON.stringify(step)).join('; ')}`);
      if (unknown.length > 0) parts.push(`${unknown.length === 1 ? 'this observation names a step' : 'these observations name steps'} the entry does not list — ${unknown.map((step) => JSON.stringify(step)).join('; ')}`);
      if (duplicated.length > 0) parts.push(`${duplicated.length === 1 ? 'this step is' : 'these steps are'} observed twice — ${[...new Set(duplicated)].map((step) => JSON.stringify(step)).join('; ')}`);
      return decline('manual-unconfirmed', `Phase ${phase} stays paused: ${parts.join(', and ')}. \`manual\` carries one observation per outstanding step, its \`step\` copied exactly as the entry lists it — a step you judged FAIL is one you leave out, and leaving it out is what holds the pause. The plan file is unchanged.`, { phase, manualOutstanding: outstanding });
    }
  } else if (payload && clause === 'manual') {
    // The read call is the one that *names* the steps, so it never refuses for their absence — only a
    // confirmation can claim to have settled them, and only a confirmation is held to it.
    return decline('manual-unconfirmed', `Phase ${phase} stays paused: its \`⏸ ${PAUSE_MANUAL}\` clause is settled by observing ${outstanding.length === 1 ? 'the step' : 'the steps'} it lists, and this payload carries no \`manual\`. Observe each one, then confirm with \`"manual": [{"step": "<the step, copied exactly>", "observed": "<what you saw, and with what>"}]\` — no \`(auto)\` result stands in for it. The plan file is unchanged.`, { phase, manualOutstanding: outstanding });
  }
  // A pause with nothing left outstanding resolves to completed; one still owing a human's eyes stays
  // paused under the other clause. `observations` is the only thing that discharges the manual half,
  // so a blocked entry confirmed without it keeps its manual steps exactly as it always did.
  const resolvesTo = outstanding.length === 0 || observations ? 'completed' : 'paused';

  // The freshness question, scoped to this phase alone: the same instrument the landing gate uses,
  // asked of the one phase being resolved. `reuse` is evidence already bought — which is what the
  // paused entry's own `**Verified:**` block buys it — and `run` is a command the caller executes once
  // and reports back in `verified`. Nothing here runs a command.
  const verify = await gateVerify(root, planPath, { phase });
  const owed = verify.commands.filter((command) => command.decision === 'run');
  const reused = verify.commands.filter((command) => command.decision === 'reuse');

  if (!payload) {
    const settled = clause === 'blocked'
      ? 'Every blocker is disposed of'
      : `Phase ${phase} is paused only for ${outstanding.length === 1 ? 'a step' : 'steps'} a human has to observe`;
    const confirmWith = clause === 'blocked' && outstanding.length > 0
      ? `Confirm to resolve the entry to \`⏸ ${PAUSE_MANUAL}\`, or settle both clauses in this call by passing \`manual\` as well.`
      : `Confirm with one \`manual\` observation per outstanding step to resolve the entry to completed.`;
    return {
      file: relative,
      phase,
      refuse: false,
      clause,
      resolvesTo,
      blockedBy: dispositions,
      unitOpen: [],
      manualOutstanding: outstanding,
      verify: { commands: verify.commands, unresolved: verify.unresolved },
      owed: owed.map((command) => command.command),
      reason: owed.length === 0 && verify.unresolved.length === 0
        ? `${settled}, and git proves Phase ${phase}'s (auto) verification still describes HEAD — nothing is owed. ${confirmWith}`
        : `${settled}. Run each command in \`owed\` and each entry in \`verify.unresolved\` exactly once, judge it against its own step text, then confirm with every one it PASSes in \`verified\`.`,
    };
  }

  // A step judged red never enters `verified.commands` — that rule is `append-log`'s and this reads
  // it back — so a red command is simply a command missing from the payload, and this refusal is how
  // the phase stays paused on one. Nothing about a red is inferred; its absence is the evidence.
  const green = new Set(payload.verified?.commands ?? []);
  const missing = owed.filter((command) => !green.has(command.command));
  if (missing.length > 0) {
    const named = missing.map((command) => `\`${command.command}\` (${command.reason})`).join('; ');
    return decline('verification-owed', `Phase ${phase} stays paused: git cannot prove ${missing.length === 1 ? 'this command' : 'these commands'} still green and the payload's \`verified.commands\` does not name ${missing.length === 1 ? 'it' : 'them'} — ${named}. Run each once, judge it against its own step text, and pass every one it PASSes. A step judged red is one this list omits, and omitting it is what keeps the phase paused. The plan file is unchanged.`, { phase, owed: owed.map((command) => command.command) });
  }

  // Every refusal is above this line. From here it is one rewrite of one entry, written once.
  const date = span.entry.heading.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/)?.[1] ?? new Date().toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const next = [...body];
  // Bottom-up: `Manual verification outstanding` sits below `Blocked by`, which sits below `Auto
  // verification`, which sits below `Verified`, which sits below the heading, so splicing in that
  // order leaves every index below it still valid.
  if (observations) {
    // The confirmation replaces the list it settles: the outstanding label is gone, so this entry can
    // never be read as still owing the steps, and each line carries the step beside what was seen.
    next.splice(manualField.line, manualField.last - manualField.line + 1,
      `**Manual verification:** confirmed ${today}`,
      ...observations.map((item) => `- ${item.step} — ${item.observed}`));
  }
  if (clause === 'blocked') {
    next.splice(blockedField.line, blockedField.last - blockedField.line + 1, '**Blocked by (resolved):**', ...dispositions.map((row) => {
      const type = row.type ? ` (${row.type})` : '';
      const reason = row.reason ? `: ${row.reason}` : '';
      const summary = row.summary ? ` — ${row.summary}` : '';
      return `- ${row.id}${type} — ${row.status}${reason}${summary}`;
    }));
  }
  next.splice(autoField.line, autoField.last - autoField.line + 1,
    // A completed entry calls its results `**Verification:**`; a phase still owing manual steps stays
    // paused and keeps the paused template's label.
    resolvesTo === 'completed' ? '**Verification:**' : body[autoField.line],
    ...autoField.items.map((item) => `- ${item}`),
    ...(payload.verification ?? []).map((item) => `- ${item}`));
  if (payload.verified) {
    const block = [`**Verified:** ${payload.verified.at}`, ...payload.verified.commands.map((command) => `- \`${command}\``)];
    const verifiedField = entryField(body, 'Verified');
    if (verifiedField) next.splice(verifiedField.line, verifiedField.last - verifiedField.line + 1, ...block);
    else {
      const commits = body.findIndex((line) => line.startsWith('**Commits:**'));
      if (commits < 0) return decline('malformed-entry', `Phase ${phase}'s entry carries no \`**Commits:**\` line, so new provenance has nowhere to land. The plan file is unchanged.`, { phase });
      next.splice(commits + 1, 0, '', ...block);
    }
  }
  next[0] = resolvesTo === 'completed'
    ? `### Phase ${phase} — completed ${date}`
    : `### Phase ${phase} — ⏸ ${PAUSE_MANUAL} (${date})`;

  const lines = [...plan.lines.slice(0, span.start), ...next, ...plan.lines.slice(span.end)];
  await atomicWrite(file, lines.join('\n'));
  return {
    file: relative,
    phase,
    refuse: false,
    clause,
    status: resolvesTo === 'completed' ? 'completed' : 'paused',
    resolvesTo,
    blockedBy: dispositions,
    reran: owed.map((command) => command.command),
    reused: reused.map((command) => command.command),
    unresolved: verify.unresolved,
    manualConfirmed: observations ? observations.map((item) => item.step) : [],
    manualOutstanding: observations ? [] : outstanding,
  };
}

// ── The second writer of `**Verified:**` ─────────────────────────────────────
// `/esq:fix` verifies before it commits and, until this verb existed, left that result nowhere: the
// only provenance `esq gate verify` could read was the block `/esq:build` wrote, and the fix commit
// itself staled it. So the landing gate re-ran a command the shipping unit had already proved green
// on the exact tree being landed (D-a-fix-records-what-it-proved).
//
// What it writes is an **append-only** `### Phase N — reverified <date>` block at the end of the
// resolved phase's own entry span. That heading is invisible to `parsePlan`'s entry regex
// (`completed|⏸`), so `nextPhase`, `esq validate`, `appendLog`'s duplicate-entry refusal and both
// pause clauses are untouched. The placement is readability — the proof sits with the entry it
// re-proves — and **not** an attribution rail: `parseVerified` attributes a block to the nearest
// `### Phase N — ` heading above it, which for this block is its own, so a Phase 1 proof appended
// after Phase 2's entry is still read as Phase 1's. Nothing here ever edits an existing entry.
//
// **Attribution is by step, never by command.** Two phases can name one command under different
// criteria — one asks for exit 0, the next for exit 0 *and* a count in the output — so "a phase names
// this command" proves nothing about what was satisfied, and picking the lowest-numbered such phase
// attributes a PASS nobody earned. The payload names the step verbatim; this resolves it by exact
// text identity against `autoSteps`, requires exactly one match, and derives the command from that
// step with `extractAutoCommand`. Unknown or ambiguous records nothing and leaves `run` standing.
//
// **No criteria engine enters the system.** Whether the observed output satisfied the step's
// criterion is judged by the run that made the observation, exactly as `/esq:build`'s block is
// today. This matches text and git state and nothing else.
//
// **What the tree equality buys, stated honestly.** `git write-tree` describes the index at the
// moment it is called: it is not evidence a command ran, exited green, or read only tracked files.
// The one mechanical guarantee is that the tree the commit carries is the tree that was staged when
// the verification ran, so `rev-parse <at>^{tree}` equalling the recorded `tree` refuses a record
// attached to a tree edited after the fact. `tree` comes from the payload and is never derived from
// `at`, which would make the check a tautology that passes for any commit.
//
// Every refusal leaves the plan byte-identical and exits 1; the caller routes off `refuse`.
const RECORD_KEYS = ['by', 'at', 'tree', 'step'];

function validateRecordPayload(json) {
  let payload;
  try { payload = JSON.parse(json); } catch { throw new Error('--confirm payload is not valid JSON'); }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('--confirm payload must be a JSON object');
  for (const key of Object.keys(payload)) {
    if (!RECORD_KEYS.includes(key)) throw new Error(`--confirm key "${key}" is not accepted; it takes ${RECORD_KEYS.join(', ')}`);
  }
  for (const key of RECORD_KEYS) {
    if (!Object.hasOwn(payload, key)) throw new Error(`--confirm key "${key}" is required; it takes ${RECORD_KEYS.join(', ')}`);
  }
  if (!fieldText(payload.by)) {
    throw new Error(structuralOffender(payload.by) ? `--confirm key "by" ${STRUCTURAL_REFUSAL}` : '--confirm key "by" must be a non-empty string naming the run that re-proved the step');
  }
  if (typeof payload.step !== 'string' || payload.step.trim() === '') throw new Error('--confirm key "step" must be the plan\'s own (auto) step, copied verbatim');
  for (const key of ['at', 'tree']) {
    if (typeof payload[key] !== 'string' || !FULL_OID.test(payload[key])) {
      throw new Error(`--confirm key "${key}" must be a full 40-character object id — a ref that can move (main, HEAD, a tag, an abbreviated hash) is a name, not provenance`);
    }
  }
  return payload;
}

export async function recordVerification(root, planPath, confirmJson) {
  // The payload is validated before the plan file is opened, exactly as `append-log`'s is: every
  // refusal above this line leaves the target byte-identical because it never reached it.
  const payload = validateRecordPayload(confirmJson);
  const file = path.resolve(root, planPath);
  const relative = path.relative(root, file) || planPath;
  const decline = (code, reason, extra = {}) => ({ file: relative, refuse: true, code, reason, ...extra });
  const unchanged = 'The plan file is unchanged.';

  const text = await readText(file);
  const plan = parsePlan(text);
  if (plan.logIndex < 0) return decline('no-log', `${relative} has no ## Execution log section, so a proof has nowhere to land. ${unchanged}`);

  // Exact text identity against the plan's own `(auto)` steps, as `autoSteps` folds them — one match
  // or nothing is recorded.
  const matches = autoSteps(text).filter((candidate) => candidate.step === payload.step);
  if (matches.length === 0) {
    return decline('step-unknown', `No (auto) step of ${relative} carries that text, so there is no phase this proof belongs to. Copy the step verbatim from the plan's own **Verification:** list — it is matched as a literal, never as a pattern. ${unchanged}`);
  }
  if (matches.length > 1) {
    const phases = [...new Set(matches.map((match) => match.phase))].sort((left, right) => left - right);
    return decline('step-ambiguous', `That step text is carried by ${matches.length} (auto) steps, in ${phases.length === 1 ? `Phase ${phases[0]}` : `Phases ${phases.join(', ')}`} — attribution would be a guess, so nothing is recorded and the landing gate re-runs the command as it does today. ${unchanged}`, { phases });
  }
  const phase = matches[0].phase;
  const command = extractAutoCommand(matches[0].step);
  if (command === null) {
    return decline('command-unresolved', `Phase ${phase}'s step resolves to no single command, so there is nothing to record as green — it is a step the gate runs in full. ${unchanged}`, { phase });
  }
  // The shape refusals the gate's reader depends on: a command carrying a backtick or a newline
  // would not survive the inline-code round trip `parseVerified` reads it back out of.
  try { validateVerified({ at: payload.at, commands: [command] }); }
  catch (error) { return decline('malformed-verified', `Phase ${phase}'s proof cannot be written: ${error.message}. ${unchanged}`, { phase }); }

  const span = logEntrySpan(plan, phase);
  if (!span) return decline('no-entry', `Phase ${phase} has no execution-log entry, so it has nothing this proof re-proves — a phase records provenance only once /esq:build has logged it. ${unchanged}`, { phase });

  // Git state. `at` has to be this repository's `HEAD`, the tree has to be clean, and the commit's
  // own tree has to be the tree the caller says it verified.
  let repository = null;
  try { repository = git(root, ['rev-parse', '--show-toplevel']); } catch { repository = null; }
  if (!repository) return decline('no-git', `git could not be read at ${root}, so no provenance can be proved here. ${unchanged}`, { phase });
  if (!gitTry(repository, ['rev-parse', '--verify', '--quiet', `${payload.at}^{commit}`])) {
    return decline('commit-unknown', `${payload.at.slice(0, 7)} is not a commit in this repository. ${unchanged}`, { phase });
  }
  const head = gitTry(repository, ['rev-parse', 'HEAD']);
  if (head !== payload.at) {
    return decline('not-head', `${payload.at.slice(0, 7)} is not HEAD (${head === null ? 'unreadable' : head.slice(0, 7)}) — a proof is recorded against the commit that carries the tree it was judged on, in the same chain that made it. ${unchanged}`, { phase });
  }
  const status = gitTry(repository, ['status', '--porcelain']);
  if (status === null) return decline('no-git', `git status could not be read, so a clean tree cannot be established. ${unchanged}`, { phase });
  if (status !== '') {
    return decline('tree-dirty', `The working tree is not clean, so what was verified is not what ${payload.at.slice(0, 7)} carries — ${status.split('\n').length} path(s) differ. ${unchanged}`, { phase });
  }
  const committed = gitTry(repository, ['rev-parse', `${payload.at}^{tree}`]);
  if (committed !== payload.tree) {
    return decline('tree-mismatch', `${payload.at.slice(0, 7)} carries tree ${committed === null ? 'nothing readable' : committed.slice(0, 7)}, not the ${payload.tree.slice(0, 7)} this proof was judged on — the tree was edited between the verification and the commit. ${unchanged}`, { phase });
  }

  // Append-only, and never twice for one tree: a phase already recording this `at` has this proof.
  //
  // **Unreachable today, and kept deliberately.** The `at` must equal `HEAD` rail above makes it so:
  // a block naming HEAD's own object id cannot already sit inside HEAD's own tree, because the text
  // would have had to be fixed before the oid it names existed. So this fires only if that rail is
  // ever relaxed — at which point double-recording one proof becomes possible, and silently doubling
  // a phase's evidence is exactly the failure the fan-out in `gateVerify` would then have to absorb.
  // One map lookup is the whole cost of not discovering that later.
  const existing = parseVerified(text).get(phase) ?? [];
  if (existing.some((block) => block.at === payload.at)) {
    return decline('already-recorded', `Phase ${phase} already records provenance at ${payload.at.slice(0, 7)} — this proof is in the ledger, and appending it twice would record nothing new. ${unchanged}`, { phase });
  }

  // Every refusal is above this line. From here it is one append inside one entry span, written once.
  const date = new Date().toISOString().slice(0, 10);
  const block = [
    `### Phase ${phase} — reverified ${date}`,
    '',
    `**Reverified by:** ${payload.by}`,
    '',
    `**Verified:** ${payload.at}`,
    `- \`${command}\``,
    '',
  ];
  // Where it lands: after this phase's entry **and after every proof already recorded under it**.
  // `logEntrySpan` ends an entry at the next `### ` heading, which after the first recording is the
  // `reverified` block this verb wrote — so inserting at that boundary would put each new proof
  // *above* the older ones and read the log backwards. The verdict would survive it (`gateVerify`
  // selects by commit generation, not by position), but an append-only ledger whose appends are not
  // in order is one nobody can read, so the scan walks past each consecutive block of this phase.
  let stop = span.end;
  const owned = new RegExp(`^### Phase ${phase} — reverified `);
  while (stop < plan.logEnd && owned.test(plan.lines[stop])) {
    let next = plan.logEnd;
    for (let index = stop + 1; index < plan.logEnd; index += 1) {
      if (/^### /.test(plan.lines[index])) { next = index; break; }
    }
    stop = next;
  }
  // Trailing blank lines are folded into the one the block ends with, so a repeated recording
  // cannot grow the file's whitespace.
  let end = stop;
  while (end > span.start && plan.lines[end - 1].trim() === '') end -= 1;
  const lines = [...plan.lines.slice(0, end), '', ...block, ...plan.lines.slice(stop)];
  await atomicWrite(file, lines.join('\n'));
  return { file: relative, phase, refuse: false, at: payload.at, tree: payload.tree, command, step: payload.step, by: payload.by, date };
}

// One readdir of docs/plans, split the way every reader of it needs: the plans, and the briefs
// beside them. `lane stats` needs both and must not pay for the directory twice.
async function planEntries(root) {
  const directory = path.join(root, 'docs/plans');
  let names;
  try {
    names = (await readdir(directory, { withFileTypes: true }))
      .filter((item) => item.isFile() && item.name.endsWith('.md'))
      .map((item) => item.name)
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') return { directory, plans: [], briefs: [] };
    throw error;
  }
  const plans = [];
  const briefs = [];
  for (const name of names) {
    if (name.endsWith('.brief.md')) briefs.push(path.join(directory, name));
    else if (!name.endsWith('.log.md')) plans.push(path.join(directory, name));
  }
  return { directory, plans, briefs };
}

async function planFiles(root) {
  return (await planEntries(root)).plans;
}

// Join only explicit IDs to the already-read ledger, including closed rows. Unknown and
// ambiguous facts stay unknown; none of these readers interprets a narrative status.
function projectionLookup(parsed, backlog) {
  const rows = new Map();
  if (parsed) {
    for (const row of parsed.table.rows) {
      const id = row[parsed.idColumn];
      const statuses = rows.get(id) ?? [];
      statuses.push(row[parsed.statusColumn]);
      rows.set(id, statuses);
    }
  }
  return (id) => {
    const unknown = (error) => ({ id, status: null, error });
    if (!parsed) return unknown(backlog?.error ?? 'docs/BACKLOG.md not found');
    const statuses = rows.get(id);
    if (!statuses) return unknown('ID not found in docs/BACKLOG.md');
    if (statuses.length !== 1) return unknown('duplicate ID in docs/BACKLOG.md');
    if (!STATUSES.has(statuses[0])) return unknown(`invalid backlog status: ${statuses[0] ?? ''}`);
    return { id, status: statuses[0] };
  };
}

// Preserve queue order and the legacy head shape. Free-form state is projected text,
// never a freshness predicate: a closed item may legitimately share an active entry.
async function roadmapState(repository, lookup) {
  const file = 'docs/ROADMAP.md';
  let text;
  try { text = await readText(path.join(repository, file)); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    return { file, head: null, entries: [], freshness: 'unknown', error: error.message };
  }
  const entries = [];
  let horizon = null;
  let entry = null;
  for (const line of text.split('\n')) {
    if (/^## /.test(line)) {
      horizon = line.match(/^## (Now|Next|Later)\s*$/)?.[1] ?? null;
      entry = null;
      continue;
    }
    if (!horizon) continue;
    const heading = line.match(/^### (.+?)\s*$/);
    if (heading) {
      entry = { horizon, slug: heading[1], covers: null, whyNow: null, needs: null, unblocks: null, state: null, acceptance: null };
      entries.push(entry);
      continue;
    }
    const field = line.match(/^\*\*(covers|why now|needs|unblocks|state|acceptance):\*\*\s*(.*)$/);
    if (!entry || !field) continue;
    const key = field[1] === 'why now' ? 'whyNow' : field[1];
    entry[key] = field[2].replace(/<!--.*?-->/g, '').trim();
  }
  const first = entries.find((item) => item.horizon === 'Now');
  const head = first ? Object.fromEntries(Object.entries(first).filter(([key]) => !['horizon', 'acceptance'].includes(key))) : null;
  for (const item of entries) {
    const ids = [...new Set(item.covers?.match(/\bB-\d+\b/g) ?? [])];
    item.live = ids.map(lookup);
  }
  return { file, head, entries, freshness: 'unassessed' };
}

// Epic's generated Backlog bullets have an explicit final status cell. Compare only
// that format, keeping the entire projected line for anything we cannot classify.
async function epicState(repository, lookup) {
  const directory = path.join(repository, 'docs/epics');
  let files;
  try { files = (await readdir(directory)).filter((file) => file.endsWith('.md')).sort(); }
  catch (error) {
    return error.code === 'ENOENT' ? [] : [{ file: 'docs/epics', error: error.message, stale: null }];
  }
  return Promise.all(files.map(async (name) => {
    const file = `docs/epics/${name}`;
    try {
      const text = await readText(path.join(repository, file));
      const rows = [];
      let inBacklog = false;
      for (const line of text.split('\n')) {
        if (/^## /.test(line)) { inBacklog = /^## Backlog\s*$/.test(line); continue; }
        if (!inBacklog) continue;
        const match = line.match(/^- (B-\d+)\b(.*)$/);
        if (!match) continue;
        const projected = match[2].match(/^ — .+ — ([^—]+)$/)?.[1] ?? null;
        const projectedStatus = STATUSES.has(projected) ? projected : null;
        const live = lookup(match[1]);
        rows.push({ ...live, projected: line, projectedStatus,
          mismatch: projectedStatus !== null && live.status !== null ? projectedStatus !== live.status : null });
      }
      const stale = rows.some((row) => row.mismatch === true) ? true
        : rows.length && rows.every((row) => row.mismatch === false) ? false : null;
      return { file, slug: name.slice(0, -3), rows, stale };
    } catch (error) { return { file, rows: [], stale: null, error: error.message }; }
  }));
}

export async function state(root) {
  const repository = git(root, ['rev-parse', '--show-toplevel']);
  const plans = [];
  const headers = [];
  for (const file of await planFiles(repository)) {
    const relative = path.relative(repository, file);
    let mtime = null;
    let text = null;
    try {
      mtime = (await stat(file)).mtime.toISOString();
      text = await readText(file);
      headers.push({ file, relative, text });
      const parsed = parsePlan(text);
      // Phase-less plans stay in the list so activePlan means "most recently modified file", as /esq:status Step 1 says.
      const phase = parsed.phases.length ? nextPhase(parsed) : { state: 'no-phases' };
      // Additive: present only while a valid marker still means something (the plan is unfinished).
      const { abandoned } = planStanding(text);
      plans.push({ file: relative, mtime, ...phase, ...(abandoned ? { abandoned } : {}) });
    } catch (error) {
      // One malformed plan must not take the whole snapshot down: it rides in plans[] as `invalid`, carrying
      // the same message validate() reports for it (minus the file prefix), and keeps its place in the mtime
      // sort — /esq:status owns the rendering of an invalid activePlan.
      const abandoned = text === null ? null : parseAbandoned(text);
      plans.push({ file: relative, mtime, state: 'invalid', error: error.message, ...(abandoned ? { abandoned } : {}) });
    }
  }
  // Newest first; date-prefixed filenames break ties (a fresh clone stamps every plan with the same mtime).
  // An entry whose stat failed has mtime null; it sorts oldest rather than breaking the comparator.
  const when = (plan) => plan.mtime ?? '';
  plans.sort((a, b) => (when(a) === when(b) ? b.file.localeCompare(a.file) : (when(a) < when(b) ? 1 : -1)));
  const activePlan = plans[0]?.file ?? null;
  let backlog = null;
  let parsedBacklog = null;
  try {
    const parsed = await backlogTable(path.join(repository, 'docs/BACKLOG.md'));
    const { table, statusColumn } = parsed;
    const counts = Object.fromEntries([...STATUSES].map((status) => [status, table.rows.filter((row) => row[statusColumn] === status).length]));
    backlog = { counts, rows: backlogRows(parsed) };
    parsedBacklog = parsed;
  } catch (error) {
    // A table backlogTable() cannot locate or shape (no ID header, no Status column) is reported beside the
    // plan and roadmap facts, never thrown: `{ error }` with no counts/rows keys, so a reader cannot take
    // an absent count for zero open items. A malformed row inside a sound table is validate()'s finding.
    if (error.code !== 'ENOENT') backlog = { error: error.message };
  }
  const lookup = projectionLookup(parsedBacklog, backlog);
  const [roadmap, epics] = await Promise.all([roadmapState(repository, lookup), epicState(repository, lookup)]);
  // The landing facts of the newest healthy plan, and only once it is complete — the plan
  // /esq:status routes its next action off. The same three facts `esq branch check` carries, read
  // from the text this loop already holds: whether it landed (a deleted branch included), whether a
  // clean review any unit plan recorded still covers HEAD, and what the unit still owes. `null` for
  // anything else, so an unfinished plan costs nothing.
  let landing = null;
  // An abandoned plan is never the one to settle on: nothing is left to build or land through it.
  const settled = plans.find((plan) => plan.state !== 'invalid' && !plan.abandoned);
  if (settled?.state === 'complete') {
    const header = headers.find((candidate) => candidate.relative === settled.file);
    if (header) {
      const recorded = parseBranch(header.text);
      const origin = parseOrigin(header.text);
      const unit = await shippingUnit(repository, recorded, headers);
      landing = {
        file: settled.file,
        branch: recorded,
        origin,
        landed: unitLanded(repository, recorded, origin, settled.file),
        coverage: unitCoverage(repository, unitHeaders(headers, recorded), header.text),
        unit: { incomplete: unit.incomplete, abandoned: unit.abandoned, open: unit.open, promised: unit.promised, findings: unit.findings },
      };
    }
  }
  return { root: repository, branch: git(repository, ['branch', '--show-current']), dirty: git(repository, ['status', '--porcelain']) !== '', activePlan, plans, backlog, roadmap, epics, landing, idBlock: await idBlock(repository), inFlight: await inFlightUnits(repository) };
}

// ── Shipping units that live on other branches ───────────────────────────────
// `/esq:plan` commits a plan, and the `Planned` flips it makes, on the unit's own `esq/<slug>` branch.
// A command standing on the origin therefore sees neither — which is how a second /esq:advance used to
// re-plan work the first had already planned, and why returning to the starting branch must not hide
// what was planned. This reads them without touching the working tree: every local branch not merged
// into HEAD, the plan files its tree carries that this tree does not, kept only when the plan's own
// **Branch:** names that branch (authority stays with the unit), and the undisposed backlog rows on that
// branch carrying `Planned by` one of its slugs. Read-only; `[]` when git cannot answer.
async function inFlightUnits(repository) {
  const current = gitTry(repository, ['branch', '--show-current']) || null;
  const refs = gitTry(repository, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  if (refs === null) return [];
  const here = new Set((await planFiles(repository)).map((file) => path.relative(repository, file)));
  const units = [];
  for (const branch of refs.split('\n').filter(Boolean)) {
    if (branch === current || !safeRef(branch)) continue;
    const ref = `refs/heads/${branch}`;
    if (gitRun(repository, ['merge-base', '--is-ancestor', ref, 'HEAD']).status === 0) continue;
    const listing = gitTry(repository, ['ls-tree', '-r', '--name-only', ref, '--', 'docs/plans']);
    if (!listing) continue;
    const plans = [];
    for (const name of listing.split('\n').filter(Boolean)) {
      if (!name.endsWith('.md') || name.endsWith('.brief.md') || name.endsWith('.log.md') || here.has(name)) continue;
      const text = gitTry(repository, ['show', `${ref}:${name}`]);
      if (text === null || parseBranch(text) !== branch) continue;
      const standing = planStanding(text);
      // A plan recorded abandoned is not a live unit: nothing is left to build through it.
      if (standing.abandoned) continue;
      plans.push({ file: name, slug: planSlug(name), origin: parseOrigin(text), state: standing.state, ...(standing.phase != null ? { phase: standing.phase } : {}) });
    }
    if (plans.length === 0) continue;
    const slugs = new Set(plans.map((plan) => plan.slug));
    const planned = [];
    const backlogText = gitTry(repository, ['show', `${ref}:docs/BACKLOG.md`]);
    if (backlogText !== null) {
      try {
        const { table, idColumn, statusColumn } = backlogTableFromText(backlogText);
        const sourceColumn = table.header.indexOf('Source');
        const summaryColumn = table.header.indexOf('Summary');
        for (const row of sourceColumn < 0 ? [] : table.rows) {
          if (UNIT_DISPOSED.has(row[statusColumn] ?? '')) continue;
          if (!unitPromisedSlugs(row[sourceColumn]).some((slug) => slugs.has(slug))) continue;
          planned.push({ id: row[idColumn] ?? '', status: row[statusColumn] ?? '', summary: summaryColumn < 0 ? '' : (row[summaryColumn] ?? '') });
        }
      } catch { /* a backlog that will not parse on that branch names no rows */ }
    }
    units.push({ branch, origin: plans[0].origin, plans, planned });
  }
  return units;
}

// ── Branch ownership ─────────────────────────────────────────────────────────
// One deterministic verdict answering whether the current branch is the one this plan owns. The
// whole determination is mechanical — a name comparison, a set membership test and an ancestry
// test — which is why it lives here rather than in a skill's prose (D-cli-owns-structure-model-owns-
// judgment): it is provable against real throwaway repositories for about a second of audit time.
//
// Reads only. It writes nothing, to git or to disk, and creates, merges and pushes nothing.

// The repository's default branch is not an input here. Ownership is a claim one plan makes against
// another, and a shipping unit is what makes the claim: `**Origin:**` is the marker, so a plan
// without one owns nothing and is owed nothing. Resolving a default branch would only reintroduce
// trunk mode — a verdict that special-cased one name out of the scan, which is exactly the coupling
// to remote state this plan removes (D-a-shipping-unit-lands-where-it-started).

function gitTry(root, args) {
  try { return git(root, args); }
  catch { return null; }
}

// Three answers, and the third is why this is not a boolean. Ancestry is asked first and is
// unchanged — `true` for a branch merged or fast-forwarded into its destination. Ancestry is not
// identity, though: a stem whose commits reached the destination by cherry-pick or rebase is no
// ancestor of it and used to read `false`, in flight, which sent the next correction onto a branch
// nobody would merge again (B-138). So when ancestry says no, patch equivalence is asked: `git
// cherry <into> <ref>` prints one line per commit on `ref`, `-` where the destination already
// carries an equivalent patch and `+` where it does not. Every commit equivalent — no `+` line, and
// at least one `-` line — is `'equivalent'`: landed by content. Any commit still `+`, or a `git
// cherry` that cannot run, is `false`: genuinely in flight. A branch that no longer resolves
// (deleted after merging) is `null`, not `false`, and so is one whose owning plan names no
// destination to have been merged into.
//
// Residual limit, recorded here because this is where the next reader meets it: a squash-merged stem
// is one destination commit patch-equivalent to no individual commit of the branch, so `git cherry`
// prints `+` for every one of them and the stem still reads `false` — in flight. Patch equivalence
// answers cherry-pick and rebase and nothing wider. B-138 is narrowed, not closed, and the residue
// fails in the safe direction: the correction is cut onto its own fresh branch.
function mergedInto(root, ref, into) {
  if (!into || !gitTry(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])) return null;
  try {
    git(root, ['merge-base', '--is-ancestor', ref, into]);
    return true;
  } catch { /* not an ancestor — ask patch equivalence below */ }
  const cherry = gitTry(root, ['cherry', into, ref]);
  if (cherry === null) return false;
  const lines = cherry.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  if (lines.some((line) => !line.startsWith('-'))) return false;
  return 'equivalent';
}

// `docs/plans/2026-08-31-plan-owns-its-branch-fixes.md` → `plan-owns-its-branch`. A plan and its
// corrective siblings are one shipping unit and legitimately share a branch, so ownership is compared
// on the stem, not the filename — and a correction of a correction is still that same unit, which is
// why the suffix comes off repeatedly rather than once: `<stem>-fixes`, `<stem>-fixes-2`,
// `<stem>-fixes-2-fixes` and `<stem>-fixes-fixes` all reduce to `<stem>`, while a name that merely
// ends in those letters without the hyphen (`prefixes`) is untouched.
//
// Scoped to branch ownership and nothing else. `briefSlug` keeps its one-shot strip (B-103) — a
// brief names the plan it corrects, one round back, not the head of the chain — and `lane stats`
// groups on `normalizeSlug` (B-127), which knows nothing about corrections at all.
//
// The stem and the generation come off the same walk, defined here once, because two loops over one
// regex drift apart the first time either is touched: `stripCorrective` answers branch ownership and
// `correctiveDepth` answers how many corrective rounds a unit has already opened (`esq brief depth`,
// and the order a unit's plans were written in).
function correctiveChain(name) {
  let depth = 0;
  for (;;) {
    const next = name.replace(/-fixes(?:-\d+)?$/, '');
    // A name that is *nothing but* the suffix keeps its last non-empty value: the empty string is an
    // identity, and it would silently join every other nameless plan into one shipping unit.
    if (next === name || next === '') return { stem: name, depth };
    name = next;
    depth += 1;
  }
}

function stripCorrective(name) {
  return correctiveChain(name).stem;
}

// How many corrective rounds a name already sits above its stem. `normalizeSlug` has eaten the
// trailing uniquifier by the time this runs, so `<stem>-fixes-2` is the *same* generation as
// `<stem>-fixes` (depth 1) — a second brief in one round, never a round of its own — while
// `<stem>-fixes-fixes` is depth 2 and `prefixes` is depth 0.
function correctiveDepth(name) {
  return correctiveChain(name).depth;
}

// The generation this repository will not open on its own: a unit already corrected twice does not
// get a third corrective plan written for it, it gets the choice between landing what stands and
// re-planning the stem (`D-corrective-generations-bounded-at-two`).
const CORRECTIVE_DEPTH_BOUND = 2;

// A plan or brief path reduced to the name the two functions above read: the date prefix and the
// trailing uniquifier off (`normalizeSlug`), and `.brief.md` stripped as one piece so a corrective
// brief's own `-fixes` group is still the last thing on the name.
function planName(file) {
  return normalizeSlug(path.basename(file).replace(/\.brief\.md$/, '').replace(/\.md$/, ''));
}

function planStem(file) {
  return stripCorrective(planName(file));
}

// `esq brief depth <plan-or-fixes-brief>` — the generation a corrective chain has reached and whether
// another round may be opened, so no skill re-derives the rule from a filename. Answered from the
// name alone: the chain is a naming convention, and the caller asking is `/esq:plan` deciding whether
// to *write* the next file, which therefore does not exist yet. Reads nothing, writes nothing.
//
// `exhausted` is an answer, not a refusal — the verb exits 0 either way, and what to do about a
// chain at the bound is the skill's judgment (D-cli-owns-structure-model-owns-judgment).
export function briefDepth(file) {
  const base = path.basename(file);
  if (!base.endsWith('.md') || base.endsWith('.log.md')) {
    throw new Error(`${file}: esq brief depth reads a plan file or a brief — a corrective chain is a naming convention over docs/plans/*.md`);
  }
  const name = planName(file);
  const depth = correctiveDepth(name);
  // The round this *path* would open, which is not the same question for the two shapes the verb is
  // handed. A plan sits at its own generation, so the next round is `depth + 1`. A corrective brief
  // is named for the round it opens — `<stem>-fixes.brief.md` is written over `<stem>.md` and opens
  // generation 1 — so its own `-fixes` group already is that round, and counting it again refuses
  // the second generation as though it were the third. Every skill calls this verb with a brief path.
  const nextGeneration = base.endsWith('.brief.md') ? depth : depth + 1;
  return {
    stem: stripCorrective(name),
    depth,
    nextGeneration,
    bound: CORRECTIVE_DEPTH_BOUND,
    verdict: nextGeneration <= CORRECTIVE_DEPTH_BOUND ? 'open' : 'exhausted',
  };
}

// `esq brief pending` — the briefs under docs/plans that still owe a plan, so a bare `/esq:plan`
// resolves a brief nobody has planned instead of whichever one was touched last.
//
// A brief is CONSUMED by the plan written from it, and the join is the one every other reader of
// docs/plans already uses: `/esq:plan` derives its slug from the brief filename, so the plan it
// writes sits beside the brief carrying that slug (`normalizeSlug` — date prefix and uniquifier off).
// Nothing is deleted to record the consumption: a grill brief is durable input, cited by the plan
// and re-read by whoever comes back to the work, and "Commit and stop" retires a corrective brief
// only. So the fact is COMPUTED rather than stored, and mtime is not it — mtime says which brief was
// touched last, never which one still owes a plan, which is how a repository with two planned,
// built and merged briefs kept handing the newest of them back to `/esq:plan`
// (D-a-brief-is-consumed-by-the-plan-that-carries-its-slug).
//
// Two refinements, both structural, both cheap:
//   - **a plan recorded abandoned consumes nothing** — `esq plan abandon` is the sanctioned way back
//     to `/esq:plan <stem>`, and a retired plan holding its brief consumed would strand the brief;
//   - **a corrective brief is pending only while it still lists a 🟡** — `/esq:plan` strikes that
//     section when it plans it and leaves the 🟢 and 🔴 items standing for `/esq:fix` and the user,
//     so a brief kept alive by an open 🔴 is not a brief waiting to be planned.
// Only the plans whose slug a brief is actually waiting on are opened; the rest are never read.
// Judgment stays with the caller: this verb names what has no plan, never which one to plan next
// (D-cli-owns-structure-model-owns-judgment).
export async function briefPending(root) {
  const repository = git(root, ['rev-parse', '--show-toplevel']);
  const { directory, plans, briefs } = await planEntries(repository);
  const relative = (file) => path.relative(repository, file);

  const candidates = briefs.map((file) => {
    const base = path.basename(file);
    return { file, slug: normalizeSlug(base.replace(/\.brief\.md$/, '')), kind: CORRECTIVE_BRIEF.test(base) ? 'corrective' : 'grill' };
  });
  // `null` means "no plan carries this slug yet"; a plan that is there and recorded abandoned leaves
  // it null so a later sibling can still answer for it.
  const planFor = new Map(candidates.map((candidate) => [candidate.slug, null]));
  for (const file of plans) {
    const slug = planSlug(file);
    if (!planFor.has(slug) || planFor.get(slug) !== null) continue;
    let text = null;
    // An unreadable plan still exists, and a brief whose plan is on disk is not pending: reading the
    // miss as "unplanned" would hand a planned brief straight back, which is the defect this verb is.
    try { text = await readText(file); } catch { text = null; }
    if (text !== null && planStanding(text).abandoned) continue;
    planFor.set(slug, relative(file));
  }

  const pending = [];
  const consumed = [];
  for (const candidate of candidates) {
    const plan = planFor.get(candidate.slug);
    let mtime = null;
    try { mtime = (await stat(candidate.file)).mtime.toISOString(); } catch { mtime = null; }
    const row = { file: relative(candidate.file), slug: candidate.slug, kind: candidate.kind, mtime };
    if (candidate.kind === 'corrective') {
      let yellow = 0;
      try { yellow = tierCounts(await readText(candidate.file)).yellow; } catch { yellow = 0; }
      row.yellow = yellow;
      if (plan === null && yellow === 0) {
        consumed.push({ ...row, plan: null, reason: 'no-yellow-left' });
        continue;
      }
    }
    if (plan !== null) consumed.push({ ...row, plan, reason: 'plan-exists' });
    else pending.push(row);
  }
  // Newest first, with the filename breaking a tie downward — the same order `state` puts plans in,
  // and for the same reason: a fresh clone stamps every file with one mtime.
  const when = (row) => row.mtime ?? '';
  pending.sort((a, b) => (when(a) === when(b) ? b.file.localeCompare(a.file) : (when(a) < when(b) ? 1 : -1)));
  return { directory: relative(directory), pending, consumed, selected: pending[0]?.file ?? null };
}

// ── The shipping unit, and the defects it filed against its own code ─────────
// The unit key is `**Branch:**` — the same field `branchCheck` already reads to decide ownership,
// and the reason recursive corrective plans (`<stem>`, `<stem>-fixes`, `<stem>-fixes-fixes`) are one
// shipping unit rather than three. `unit.open` is what that unit has filed against itself and not
// disposed of: a 🐛 bug or ⚠️ debt row whose `Source` names `build:` or `fix:` on one of the unit's
// slugs, whose `Status` is neither `Done` nor `Dropped`.
//
// Structure only, no judgment (D-cli-owns-structure-model-owns-judgment): it reads three table cells
// and one header field, and weighs no severity. Two exclusions fall out of that rather than out of an
// exemption list anyone has to maintain — a 💡 idea row is non-blocking by *type*, and a row a finder
// filed (`check:`, `review:`) is non-blocking by *source verb*, because neither is a defect a build or
// fix step of this unit parked while reporting itself complete.
//
// A plan recording no `**Branch:**` belongs to no unit, so its `open` list is empty and it is blocked
// by nothing. So is a repository with no `docs/BACKLOG.md`: nothing to read is nothing to block on.

// The two blocking type cells, matched on the glyph or on the word beside it — real ledgers write
// `🐛 bug`, and a table that carries only the word is read the same way rather than silently exempt.
const UNIT_BLOCKING_TYPES = [['bug', '🐛', /\bbugs?\b/i], ['debt', '⚠️', /\bdebt\b/i]];

// `Done` and `Dropped` are the closed vocabulary /esq:backlog already writes, and the only thing that
// releases the gate. Every other status — `Open`, `Planned`, `Needs-decision` — is an undisposed row.
const UNIT_DISPOSED = new Set(['Done', 'Dropped']);

// `build: <slug> Phase N` and `fix: <slug>` are the two source verbs a phase of this workflow writes.
// The `· Planned by <slug>` / `· Done by <slug>` markers that follow carry no verb, so they cannot be
// read as one; trailing ledger punctuation is not part of the slug.
const UNIT_SOURCE_VERB = /\b(?:build|fix):\s*(\S+)/g;

function unitType(cell) {
  const text = String(cell ?? '');
  return UNIT_BLOCKING_TYPES.find(([, glyph, word]) => text.includes(glyph) || word.test(text))?.[0] ?? null;
}

function unitSourceSlugs(cell) {
  return [...String(cell ?? '').matchAll(UNIT_SOURCE_VERB)]
    .map((match) => normalizeSlug(match[1].replace(/[.,;:·]+$/, '')));
}

// One readdir and one read per plan, shared by everything in this section that needs a plan's header:
// the ownership scan and the unit both want the same texts, and neither should pay for them twice.
async function planHeaders(repository) {
  const headers = [];
  for (const file of await planFiles(repository)) {
    let text;
    try { text = await readText(file); }
    catch { continue; }
    headers.push({ file, relative: path.relative(repository, file), text });
  }
  return headers;
}

// What the unit *promised* rather than what it broke: `/esq:plan` stamps ` · Planned by <slug>` into
// every row it picks up, so an undisposed row carrying one of this unit's slugs is work the unit
// said it would deliver and nobody has yet recorded as delivered or dropped. `Needs-decision` counts
// — a promise waiting on a decision is still owed. Any type: a promise is not a defect, so the 🐛/⚠️
// filter above does not apply. `/esq:backlog` stays the only writer that releases it.
const UNIT_PROMISE = /\bPlanned by\s+(\S+)/g;

function unitPromisedSlugs(cell) {
  return [...String(cell ?? '').matchAll(UNIT_PROMISE)]
    .map((match) => normalizeSlug(match[1].replace(/[.,;:·]+$/, '')));
}

// A live corrective brief belongs to a unit through the plan its `Source:` line names — the header
// `/esq:check` and `/esq:review` both write — never through its filename. Only the `-fixes` shape is
// a finding: a grill brief corrects nothing. Deleted briefs are gone, and nothing here reconstructs
// one from history.
const BRIEF_SOURCE = /^Source:\s*\/esq:(check|review)\s+on\s+([^,\s]+)/m;

async function unitFindings(repository, slugs) {
  const findings = [];
  for (const brief of (await planEntries(repository)).briefs) {
    if (!CORRECTIVE_BRIEF.test(path.basename(brief))) continue;
    let text;
    try { text = await readText(brief); }
    catch { continue; }
    const source = BRIEF_SOURCE.exec(text);
    if (!source || !slugs.has(normalizeSlug(source[2].replace(/\.md$/, '')))) continue;
    const counts = tierCounts(text);
    if (counts.green + counts.yellow + counts.red === 0) continue;
    findings.push({ file: path.relative(repository, brief), source: source[1], plan: source[2], ...counts });
  }
  return findings;
}

// Where one plan stands, from its text alone: `esq next-phase`'s state (`ready`, `paused`, `complete`)
// and the phase it names, `no-phases` for a plan with none, `invalid` for one that will not parse.
// Plus its recorded abandonment — which only means something while the plan is unfinished: a plan
// built after it was abandoned completes, counts toward the gate again, and the marker is inert.
function planStanding(text) {
  let standing;
  try {
    const parsed = parsePlan(text);
    if (parsed.phases.length === 0) standing = { state: 'no-phases', phase: null };
    else {
      const next = nextPhase(parsed);
      standing = { state: next.state, phase: next.phase?.number ?? null };
    }
  } catch { standing = { state: 'invalid', phase: null }; }
  return { ...standing, abandoned: standing.state === 'complete' ? null : parseAbandoned(text) };
}

// A unit is finished when every plan recording its `**Branch:**` is complete or recorded abandoned.
// `incomplete` is every other plan, oldest first — so its first entry is the one to build next, and
// the list is the same whichever unit plan the caller was handed. `abandoned` is the recorded way out,
// and it retracts only unbuilt phases: `promised` and `findings` still count the abandoned plan.
async function shippingUnit(repository, branch, headers) {
  const unit = { branch: branch ?? null, plans: [], incomplete: [], abandoned: [], open: [], promised: [], findings: [] };
  if (!unit.branch) return unit;
  const slugs = new Set();
  for (const header of headers) {
    if (parseBranch(header.text) !== unit.branch) continue;
    unit.plans.push(header.relative);
    slugs.add(planSlug(header.file));
  }
  if (unit.plans.length === 0) return unit;
  for (const header of unitHeaders(headers, unit.branch)) {
    const standing = planStanding(header.text);
    if (standing.abandoned) unit.abandoned.push({ plan: header.relative, ...standing.abandoned });
    else if (standing.state !== 'complete') unit.incomplete.push({ plan: header.relative, state: standing.state, phase: standing.phase });
  }
  unit.findings = await unitFindings(repository, slugs);
  let parsed;
  try { parsed = await backlogTable(path.join(repository, 'docs/BACKLOG.md')); }
  catch { return unit; }
  const { table, idColumn, statusColumn } = parsed;
  const column = (name) => table.header.indexOf(name);
  const typeColumn = column('Type');
  const sourceColumn = column('Source');
  if (sourceColumn < 0) return unit;
  for (const row of table.rows) {
    const status = row[statusColumn] ?? '';
    if (UNIT_DISPOSED.has(status)) continue;
    const source = row[sourceColumn] ?? '';
    if (unitPromisedSlugs(source).some((slug) => slugs.has(slug))) {
      unit.promised.push({ id: row[idColumn] ?? '', type: typeColumn < 0 ? '' : (row[typeColumn] ?? ''), status, source });
    }
    const type = typeColumn < 0 ? null : unitType(row[typeColumn]);
    if (!type) continue;
    if (!unitSourceSlugs(source).some((slug) => slugs.has(slug))) continue;
    unit.open.push({ id: row[idColumn] ?? '', type, status, source });
  }
  return unit;
}

// What a caller that is about to write a `completed` execution-log entry needs, derived from the plan
// file's own path rather than from git: a plan lives at `<root>/docs/plans/<name>.md`, so its root is
// two directories up from the one holding it. `appendLog` has no repository argument and must not
// grow a subprocess to get one.
async function unitForPlan(planPath, planText = null) {
  const file = path.resolve(planPath);
  const repository = path.resolve(path.dirname(file), '../..');
  let text = planText;
  if (text === null) {
    try { text = await readText(file); }
    catch { return { branch: null, plans: [], incomplete: [], abandoned: [], open: [], promised: [], findings: [] }; }
  }
  return shippingUnit(repository, parseBranch(text), await planHeaders(repository));
}

// `at` turns the verdict into an assertion made immediately before a write: `HEAD`, and the recorded
// branch's own ref, are still exactly this commit. `/esq:land` passes the `head` its verification ran
// on and chains this into `esq merge land` in one shell call, so a commit made while the verification
// ran — minutes, on a real suite — refuses the merge instead of landing unverified. Asked last, after
// every existing verdict, so a refusal that fires today keeps its verdict and its reason; it can only
// turn a non-refusing verdict into `moved`. The merge engine is not touched.
export async function branchCheck(root, planPath, { at = null } = {}) {
  if (at !== null && (typeof at !== 'string' || !FULL_OID.test(at))) {
    throw new Error('--at takes the full 40-character commit `esq gate verify` reported as `head` — a ref that can move is a name, not provenance');
  }
  const verdict = await branchVerdict(root, planPath);
  if (at === null || verdict.refuse) return verdict;
  const tip = verdict.recorded && safeRef(verdict.recorded)
    ? gitTry(verdict.root, ['rev-parse', '--verify', '--quiet', `refs/heads/${verdict.recorded}^{commit}`])
    : null;
  const moved = [];
  if (verdict.head !== at) moved.push(`HEAD is ${verdict.head ? verdict.head.slice(0, 7) : 'unborn'}`);
  if (verdict.recorded && safeRef(verdict.recorded) && tip !== at) moved.push(`${verdict.recorded} is ${tip ? tip.slice(0, 7) : 'gone'}`);
  if (moved.length === 0) return verdict;
  return { ...verdict, verdict: 'moved', refuse: true, reason: `${moved.join(' and ')}, not ${at.slice(0, 7)} — something moved after verification ran on ${at.slice(0, 7)}, so nothing lands; a no-op.` };
}

async function branchVerdict(root, planPath) {
  const repository = git(root, ['rev-parse', '--show-toplevel']);
  const file = path.relative(repository, path.resolve(root, planPath)) || planPath;
  const branch = git(repository, ['branch', '--show-current']) || null;
  const dirty = git(repository, ['status', '--porcelain']) !== '';
  // Reported, never routed off by this verdict: the commit every fact below was read against.
  const head = gitTry(repository, ['rev-parse', '--verify', '--quiet', 'HEAD']) || null;
  const header = await readText(path.resolve(root, planPath));
  const recorded = parseBranch(header);
  // Reported, never routed off: `origin` is where this plan's work lands, and a consumer that wants
  // that fact should not have to re-open the plan file to get it. Nothing below branches on it except
  // the ownership scan, and there it is the shipping-unit marker, not a destination.
  const origin = parseOrigin(header);
  // The unit is keyed on what this plan *records*, never on HEAD, so the block is the same fact on a
  // `mismatch` verdict as on an `ok` one — and empty on a plan that records nothing to be a unit of.
  // Computed here, above every return, because `/esq:converge` reads it before it spawns and must get
  // it from whichever verdict it lands on. `unit.open` is a new key on a verdict several commands
  // already parse; every existing key above is untouched and still reads exactly what it read before.
  const headers = await planHeaders(repository);
  const unit = await shippingUnit(repository, recorded, headers);
  // Two landing facts ride on every verdict, computed from the header and git and never from HEAD,
  // so they read the same on `mismatch` as on `ok`. `landed` is asked before any refusal is decided:
  // a unit that already landed is most often inspected from its destination branch, where the
  // verdict below is `mismatch` — and a consumer routing off `refuse` first would report a branch
  // problem about work that is finished. It is `unitLanded`'s answer: `mergedInto`'s three states
  // (`true`, `'equivalent'`, `false`) while the branch resolves, `true` once a deleted branch's plan
  // file last changed in a commit the origin holds, and `null` when the plan names no two distinct
  // usable refs or nothing can be proved. `coverage` is whether a clean review any unit plan recorded
  // still describes HEAD — the same answer whichever unit plan was passed.
  const landed = unitLanded(repository, recorded, origin, file);
  const members = unitHeaders(headers, recorded);
  if (recorded && !members.some((member) => member.relative === file)) members.push({ file: path.resolve(root, planPath), relative: file, text: header });
  const coverage = unitCoverage(repository, members, header);
  // The landing's fifth fact, and the only one about a place rather than a state: which checkout owns
  // this plan's `**Origin:**`, and whether it can be merged in. It rides here so `/esq:land` can stop on
  // an unusable destination out of a verdict it already reads in preflight, before it spends a minute of
  // verification on a merge that cannot happen — read-only, and `null` for a plan with no usable origin
  // to have a landing site for. Reported, never routed off *here*: no verdict below branches on it, and
  // `esq merge land` resolves it again in its own process rather than trusting this one (B-154).
  const destination = origin ? landingSite(repository, origin) : null;
  const verdict = (name, refuse, reason, owners = []) =>
    ({ root: repository, file, branch, head, recorded, origin, dirty, verdict: name, owners, unit, landed, coverage, destination, refuse, reason });

  // First match wins, in this order.
  if (!branch) {
    return verdict('detached', true, 'HEAD is detached — a phase committed here belongs to no branch, so nothing could attribute its commits later.');
  }
  if (!recorded) {
    return verdict('unrecorded', false, `this plan records no **Branch:** field, so it claims nothing — building on ${branch} as before.`);
  }
  if (recorded !== branch) {
    return verdict('mismatch', true, `this plan records **Branch:** ${recorded}, and HEAD is on ${branch}.`);
  }
  if (!origin) {
    // Legacy: a plan written before `**Origin:**` existed records a branch but is not a shipping unit.
    // It never lands, so it claims nothing against anyone — and the thirty-odd plans recording `main`
    // in this repository would otherwise all become owners of it and make the repository unbuildable.
    // Its `**Branch:**` field keeps its build-time meaning: the mismatch refusal above still fired.
    return verdict('ok', false, `${branch} is the branch this plan records; the plan records no **Origin:**, so it is legacy and claims no branch against any other plan.`);
  }

  // Ownership is computed from docs/plans/ in *this* working tree. A linked worktree carries its own
  // copy, so two worktrees can each record the same name without either verdict seeing the other;
  // git's own refusal to check one branch out twice is what prevents that collision. The verdict says
  // what it can see and implies no repo-wide knowledge.
  const stem = planStem(file);
  const owners = [];
  for (const { relative, text: otherText } of headers) {
    if (relative === file || planStem(relative) === stem) continue;
    if (parseBranch(otherText) !== branch) continue;
    // Same rule in the other direction: a legacy plan is not an owner, so it cannot displace the
    // shipping unit that is standing here.
    const otherOrigin = parseOrigin(otherText);
    if (!otherOrigin) continue;
    // `merged` is three-state and consumer-visible: `true` merged by ancestry, `'equivalent'` landed
    // by content (cherry-picked or rebased onto the owner's origin), `false` still in flight, `null`
    // for a branch that no longer resolves. It is carried for the refusal's wording and decides
    // nothing — but a consumer testing it for truthiness must read `'equivalent'` as landed, which is
    // exactly the reading B-138 got wrong the other way round.
    owners.push({ file: relative, branch, origin: otherOrigin, merged: mergedInto(repository, branch, otherOrigin) });
  }
  if (owners.length > 0) {
    return verdict('owned-elsewhere', true, `${branch} is already recorded by ${owners.map((owner) => owner.file).join(', ')} — one branch owning several plans is what makes a commit range unattributable.`, owners);
  }
  return verdict('ok', false, `${branch} is the branch this plan records and no other plan claims it.`);
}


// ── Which branch a plan about to be written belongs on ───────────────────────
// Read-only, and it creates nothing: `/esq:plan` asks this before it cuts anything, and the answer
// is `mode` — `reuse` to copy an existing shipping unit's two header fields, `new` to cut
// `esq/<slug>` from the returned origin. B-102 made a corrective plan copy its stem's fields
// verbatim, which was right only while the stem was still in flight; once the stem had landed and
// its branch was merged, the copy put the correction onto a branch nobody would merge again, and the
// maintainer repaired it by hand with a `git switch -c`, a cherry-pick and a header edit.
//
// Every question it cannot answer is a `new` decision with its reason named — no plan for the stem, a
// stem plan that is legacy or unreadable, a detached HEAD, no git at all. `new` is the safe fallback
// in every one of them: cutting a fresh branch loses nothing but a shared name, where a wrong `reuse`
// puts commits somewhere they cannot land.
export async function branchResolve(root, rawSlug) {
  const slug = String(rawSlug ?? '').trim();
  const canonical = normalizeSlug(slug);
  const stem = stripCorrective(canonical);
  const corrective = stem !== canonical;
  let repository = null;
  try { repository = git(root, ['rev-parse', '--show-toplevel']); } catch { repository = null; }
  const current = repository ? (gitTry(repository, ['branch', '--show-current']) || null) : null;
  const answer = (mode, branch, origin, reason) => ({ slug, stem, corrective, mode, branch, origin, reason });
  const cut = (origin, reason) => answer('new', `esq/${slug}`, origin, reason);

  if (!corrective) {
    if (!repository) return cut(null, 'no git repository here, so there is no origin to record — cut nothing and omit both fields.');
    if (!current) return cut(null, 'HEAD is detached, so there is no origin to record — cut nothing and omit both fields.');
    return cut(current, `${slug} names no stem, so this is a new shipping unit cut from ${current}.`);
  }

  // The stem plan is found by slug over docs/plans, never by a path guess: the date prefix and the
  // finder's uniquifier are noise on the join, exactly as they are for a brief.
  let stemFile = null;
  if (repository) {
    for (const other of await planFiles(repository)) {
      if (planSlug(other) === stem) { stemFile = other; break; }
    }
  }
  if (!stemFile) return cut(current, `no plan in docs/plans carries the slug \`${stem}\` this one corrects, so there is no shipping unit to join.`);
  let text;
  try { text = await readText(stemFile); }
  catch { return cut(current, `${path.relative(repository, stemFile)} could not be read, so its shipping unit is unknown.`); }
  const file = path.relative(repository, stemFile);
  const recorded = parseBranch(text);
  const origin = parseOrigin(text);
  // Legacy in either direction is not a shipping unit: a plan with no `**Origin:**` never lands, and
  // one with no `**Branch:**` claims nothing to be joined.
  if (!origin) return cut(current, `${file} records no **Origin:**, so it is legacy — it never lands, and there is no destination to inherit.`);
  if (!recorded) return cut(origin, `${file} records no **Branch:**, so there is no branch to reuse; cut one and land it on ${origin}.`);
  const merged = mergedInto(repository, recorded, origin);
  if (merged === false) {
    return answer('reuse', recorded, origin, `${file} is still in flight — ${recorded} exists and has not landed on ${origin} — so this correction is more of that same shipping unit.`);
  }
  if (merged === null) return cut(origin, `${recorded} no longer exists, so ${file}'s shipping unit has been retired; cut a new one and land it on ${origin}.`);
  if (merged === 'equivalent') {
    return cut(origin, `${recorded}'s commits are already on ${origin} by cherry-pick or rebase, so ${file} has landed by content even though ${recorded} is no ancestor of it; reusing that branch would put this correction where nothing will merge it.`);
  }
  return cut(origin, `${recorded} has already landed on ${origin}, so reusing it would put this correction on a branch nobody will merge again.`);
}

// ── The landing gate's freshness question ────────────────────────────────────
// Read-only, and it executes nothing. `/esq:land` asks it before it re-runs anything; the landing
// gate it serves used to re-run every phase's
// `(auto)` step blindly: a measured ESQ run re-bought a 9m30 `pnpm test` over the
// exact tree the phase had already run it on, with no implementation commit in between, and it
// replays identical commands named by several phases once per phase. This verb answers, per distinct
// command, whether git can *prove* the last green result still describes HEAD — and returns
// decisions and exact strings, never a subprocess it ran. The orchestrator keeps execution ownership
// (D-cli-owns-structure-model-owns-judgment), which is also why nothing derived from Markdown is
// executed in this process.
//
// It lowers no correctness condition. `reuse` requires all of: a `verified` block on that
// occurrence's phase, an `at` git resolves, the command present in that block's green list, and every
// path changed since it harmless. Everything else is `run`, with the reason named.

// Command-owned lifecycle is harmless only when it is not a known command input: an append below
// `## Execution log` in the active plan, another plan or brief, and the two ledgers. Plain operands
// and valid `(reads)` declarations take precedence. ROADMAP.md and epics have no blanket exemption.
const GATE_LEDGERS = new Set(['docs/BACKLOG.md', 'docs/DECISIONS.md']);

// Two bookkeeping fields are left out of the comparison, and only two: the `**Reviewed at:**` header
// line `esq plan set-reviewed` writes and the `**Abandoned:**` line `esq plan abandon` writes, each
// with the blank line its writer inserts above it. Recording that a review covered this tree, or that
// a plan will not be built, changes nothing a completed phase claims, so neither may stale the
// evidence already recorded. Every other byte above `## Execution log` still invalidates.
function planSection(text) {
  const lines = text.split('\n');
  const index = lines.findIndex((line) => line.trim() === '## Execution log');
  const section = index < 0 ? lines : lines.slice(0, index);
  const header = section.findIndex((line) => /^##\s/.test(line));
  const kept = [];
  for (const [position, line] of section.entries()) {
    if ((header < 0 || position < header) && (REVIEWED_AT_LINE.test(line) || ABANDONED_LINE.test(line))) {
      if (kept.length > 0 && kept.at(-1) === '') kept.pop();
      continue;
    }
    kept.push(line);
  }
  return kept.join('\n').trimEnd();
}

// The order a unit's plans were written in, which is what "newer" means across plans: the date prefix,
// then how deep in the corrective chain the name sits (`<stem>` before `<stem>-fixes` before
// `<stem>-fixes-fixes`), then the name. A plan with no date sorts first. Used only to break ties and
// to pick whose step text travels — never to decide whether anything is proved. The depth itself is
// `correctiveDepth`, defined beside `stripCorrective` above and shared with `esq brief depth`.
function unitOrder(left, right) {
  const leftDate = fileDate(left) ?? '';
  const rightDate = fileDate(right) ?? '';
  if (leftDate !== rightDate) return leftDate < rightDate ? -1 : 1;
  const depth = correctiveDepth(planName(left)) - correctiveDepth(planName(right));
  if (depth !== 0) return depth;
  return path.basename(left).localeCompare(path.basename(right));
}

// The unit's plan headers, oldest first: every plan recording `branch`. The one membership rule
// `shippingUnit`, the unit gate and unit coverage all share, so no two of them can disagree on it.
function unitHeaders(headers, branch) {
  if (!branch) return [];
  return headers.filter((header) => parseBranch(header.text) === branch)
    .sort((left, right) => unitOrder(left.relative, right.relative));
}

// How far along history a commit sits: the number of commits reachable from it. A descendant always
// counts more than its ancestor, so across one branch's proofs the larger number is the newer proof.
// `-1` for anything git will not count.
function generation(repository, oid, cache) {
  if (cache.has(oid)) return cache.get(oid);
  const counted = Number.parseInt(gitTry(repository, ['rev-list', '--count', oid]) ?? '', 10);
  const value = Number.isFinite(counted) ? counted : -1;
  cache.set(oid, value);
  return value;
}

// Why the command runs, naming the whole set rather than its first member. A landing that re-runs
// four commands and prints one path four times tells the user nothing about which rerun was owed,
// and a `(reads)` declaration can only be written truthfully by someone who can see what actually
// invalidated the proof. Bounded at four named paths plus a count, because the reason is a sentence
// a person reads; the first path stays first, so a single-path run reads exactly as it always did.
function changedSince(paths, name) {
  const [first, ...rest] = paths;
  const opening = `${first} changed since ${name} verified`;
  if (rest.length === 0) return opening;
  const named = rest.slice(0, 3);
  const remainder = rest.length - named.length;
  return `${opening}, and so did ${named.join(', ')}${remainder > 0 ? ` and ${remainder} more` : ''}`;
}

// Does a declared path cover a repository path? Whole path segments, never a glob: `plugin/lib`
// covers `plugin/lib/cli.mjs` and does not cover `plugin/library.mjs`. The parser refuses a pattern
// outright, so there is exactly one matching rule here and nothing that reads like a second one.
function declaresPath(paths, candidate) {
  return paths.some((entry) => candidate === entry || candidate.startsWith(`${entry}/`));
}

// The inputs a command names in its own argument vector — `{ operands }` when every token can be
// classified, `{ unsupported }` naming the first token that cannot. **There is no third answer, and
// that is the whole design:** a command this cannot decompose is one whose declaration is not
// honoured, because claiming "all operands covered" over a form it does not understand is how a
// wrong declaration gets accepted. An earlier version skipped every token without a `/`, which made
// `node check.mjs` name no operand at all: a declaration reading `src/` was accepted, `check.mjs`
// changed under it, and the gate answered `reuse` while running the command exited 1.
//
// So a plain word is an operand **whether or not it carries a slash** — nothing in a command string
// distinguishes a subcommand from a filename, and demanding coverage of `test` in `pnpm test …` is
// the safe half of that ambiguity. What this deliberately does not do is parse a shell: a quote, a
// glob, a `$`, a redirection or a `&&` is refused rather than interpreted.
//
// And what it checks is never completeness. It sees the paths the command says out loud; a suite's
// imports, a runner's config and a spawned binary are invisible to it, and only the author can
// establish those.
// Two flag shapes carry no value, and only two: a long flag, and a *single* short flag. A
// multi-character short cluster is refused rather than skipped, because `-rn` (two short flags) and
// `-Iinc` (a flag with its value attached) are the same string to anything short of the tool's own
// option table — and reading `-Iinc` as a bare flag dropped `inc/` out of the coverage check, so a
// declaration naming only `main.c` was honoured while `inc/header.h` changed under it.
const PLAIN_TOKEN = /^(?:\.\/)?[A-Za-z0-9._][A-Za-z0-9._\-/]*$/;
const LONG_FLAG = /^--[A-Za-z0-9][A-Za-z0-9-]*$/;
const SHORT_FLAG = /^-[A-Za-z0-9]$/;

function commandInputs(command) {
  const tokens = command.split(/\s+/).filter((token) => token !== '');
  if (tokens.length === 0) return { unsupported: command };
  const operands = [];
  const add = (raw) => {
    if (!PLAIN_TOKEN.test(raw)) return false;
    const stripped = raw.startsWith('./') ? raw.slice(2) : raw;
    const normalized = stripped.endsWith('/') ? stripped.slice(0, -1) : stripped;
    if (normalized !== '' && !operands.includes(normalized)) operands.push(normalized);
    return true;
  };
  for (const [index, token] of tokens.entries()) {
    // Token 0 is the program. A bare name resolves on `PATH` and is no repository input; a token
    // carrying a `/` is one — `./scripts/audit.sh` reads itself.
    if (index === 0) {
      if (!PLAIN_TOKEN.test(token)) return { unsupported: token };
      if (token.includes('/')) add(token);
      continue;
    }
    if (LONG_FLAG.test(token) || SHORT_FLAG.test(token)) continue;
    const inline = token.match(/^--[A-Za-z0-9][A-Za-z0-9-]*=(.+)$/);
    if (inline) {
      if (!add(inline[1])) return { unsupported: token };
      continue;
    }
    if (!add(token)) return { unsupported: token };
  }
  return { operands };
}

export async function gateVerify(root, planPath, { workersMoved = false, phase = null, unit = false } = {}) {
  const text = await readText(path.resolve(root, planPath));
  let repository = null;
  try { repository = git(root, ['rev-parse', '--show-toplevel']); } catch { repository = null; }
  const file = repository ? (path.relative(repository, path.resolve(root, planPath)) || planPath) : planPath;
  const head = repository ? gitTry(repository, ['rev-parse', 'HEAD']) : null;

  // The plans whose steps are in scope. Without `unit`, the one plan — exactly what this verb always
  // answered. With it, every plan recording this plan's `**Branch:**`, because `esq merge land`
  // merges the whole branch and a `-fixes` commit can invalidate a test only the initial plan names.
  // A plan recording no branch is a unit of one. Each occurrence keeps its own plan's text and
  // `verified` blocks: the invalidation rules below are judged against the plan that recorded the
  // proof, so they read exactly as they did for a single plan.
  let sources = [{ file, text }];
  if (unit && repository) {
    const members = unitHeaders(await planHeaders(repository), parseBranch(text))
      .map((header) => (header.relative === file ? { file, text } : { file: header.relative, text: header.text }));
    if (!members.some((member) => member.file === file)) members.push({ file, text });
    sources = members.sort((left, right) => unitOrder(left.file, right.file));
  }
  const scoped = sources.length > 1;
  const label = (occurrence) => `${scoped ? `${occurrence.plan} ` : ''}Phase ${occurrence.phase}`;

  // One occurrence's verdict against **one** of the blocks its phase records, and nothing else. A
  // phase can record more than one — `/esq:build` writes one with the entry, `esq plan
  // record-verification` appends another when `/esq:fix` re-proves a step on a newer tree — so the
  // block being judged is handed in rather than looked up. Every condition below is exactly the one
  // it always was; what changed is only how many blocks reach them.
  const evaluate = (occurrence, command, block) => {
    const run = (reason) => ({ decision: 'run', reason });
    const name = label(occurrence);
    if (workersMoved) return run('an apply or fix worker moved HEAD after these phases ran, so nothing recorded before it still describes this tree');
    if (!repository || !head) return run('git could not be read here, so no freshness can be proved');
    if (!block) return run(`${name} recorded no verified provenance`);
    if (!FULL_OID.test(block.at)) return run(`${name}'s provenance records \`${block.at}\`, a name that can move rather than a commit`);
    if (!block.commands.includes(command)) return run(`${name}'s green list does not name this command`);
    if (!gitTry(repository, ['rev-parse', '--verify', '--quiet', `${block.at}^{commit}`])) {
      return run(`${name}'s verified commit ${block.at.slice(0, 7)} is not in this repository`);
    }
    // Resolve the input scope before exempting bookkeeping. A plan or ledger can itself be a
    // command input: its lifecycle role cannot make a changed input harmless. Invalid declarations
    // still cannot narrow the check; plain operands remain known inputs even without a declaration.
    const inputs = commandInputs(command);
    const declared = declaredInputs(occurrence.step);
    let scope = null;
    let ignored = null;
    if (declared !== null) {
      if (declared.malformed) {
        ignored = `its \`(reads)\` declaration ${declared.malformed}`;
      } else {
        const uncovered = (inputs.operands ?? []).filter((operand) => !declaresPath(declared.paths, operand));
        if (inputs.unsupported !== undefined) {
          ignored = `its \`(reads)\` declaration cannot be checked against \`${inputs.unsupported}\`, a token this gate does not decompose`;
        } else if (uncovered.length > 0) {
          ignored = `its \`(reads)\` declaration does not cover \`${uncovered[0]}\`, a path the command itself names`;
        } else {
          scope = declared.paths;
        }
      }
    }

    // `--no-renames`: a rename out of an invalidating path must report that path, not only the
    // harmless one it landed on.
    const diff = gitTry(repository, ['diff', '--name-only', '--no-renames', block.at, 'HEAD']);
    if (diff === null) return run(`git could not diff ${block.at.slice(0, 7)} against HEAD`);
    const invalidating = [];
    for (const changed of diff.split('\n').filter((line) => line !== '')) {
      if (changed === occurrence.plan) {
        // The plan that recorded the proof: an append below `## Execution log` is this command's own
        // bookkeeping; an edit anywhere above it changes what the phases claim, so it invalidates.
        // A `(reads)` declaration lives above that line, so editing one stales this plan's own
        // proofs right here — which is why no declaration may narrow this case away.
        const before = gitTry(repository, ['show', `${block.at}:${occurrence.plan}`]);
        if (before === null || planSection(before) !== planSection(occurrence.text)) return run(`${occurrence.plan} changed above its ## Execution log since ${name} verified`);
      }
      const isInput = declaresPath(inputs.operands ?? [], changed)
        || (scope !== null && declaresPath(scope, changed));
      if (isInput) {
        invalidating.push(changed);
        continue;
      }
      if (changed === occurrence.plan) continue;
      if (changed.startsWith('docs/plans/') && changed.endsWith('.md')) continue;
      if (GATE_LEDGERS.has(changed)) continue;
      invalidating.push(changed);
    }

    const counted = scope === null ? invalidating : invalidating.filter((changed) => declaresPath(scope, changed));
    if (counted.length === 0) {
      const how = scope === null
        ? 'nothing since touches anything but the command-owned lifecycle'
        : 'everything since lies outside what the step declares this command reads';
      return { decision: 'reuse', reason: `${name} proved it on ${block.at.slice(0, 7)}, and ${how}`, verifiedAt: block.at };
    }
    return run(`${changedSince(counted, name)}${ignored === null ? '' : `, and ${ignored}`}`);
  };

  const groups = new Map();
  const unresolved = [];
  const abandoned = [];
  for (const [order, source] of sources.entries()) {
    const verified = parseVerified(source.text);
    // Under `unit` only: a plan recorded abandoned will not build its unfinished phases, so their steps
    // have nothing to prove and leave the union. The phases it did complete shipped code onto this
    // branch, so their steps stay. Without `unit` the verb answers exactly what it always answered.
    let skipped = null;
    if (unit && planStanding(source.text).abandoned) {
      abandoned.push(source.file);
      const { entries } = parsePlan(source.text);
      skipped = (number) => entries.get(number)?.status !== 'completed';
    }
    for (const occurrence of autoSteps(source.text)) {
      // `phase` scopes the answer to one phase's own steps — the landing gate asks for the whole unit,
      // `esq plan resolve-block` asks only about the phase whose pause it is resolving.
      if (phase !== null && occurrence.phase !== phase) continue;
      if (skipped?.(occurrence.phase)) continue;
      const command = extractAutoCommand(occurrence.step);
      // An unresolved occurrence is never deduplicated — against another unresolved one or against a
      // resolved command, in this plan or another — because its identity cannot be proved. Each runs
      // conservatively.
      if (command === null) { unresolved.push({ resolved: false, decision: 'run', plan: source.file, phase: occurrence.phase, step: occurrence.step }); continue; }
      if (!groups.has(command)) groups.set(command, []);
      groups.get(command).push({ ...occurrence, order, plan: source.file, text: source.text, verified });
    }
  }

  const generations = new Map();
  const commands = [];
  for (const [command, occurrences] of groups) {
    // Newest first — the newest plan, then its newest phase: one fresh, valid, green occurrence
    // satisfies the command once, and an older stale occurrence never forces a duplicate rerun behind
    // it. Among several proofs the newest *proof* wins — the verified commit furthest along history,
    // position breaking a tie — so a `-fixes` plan's audit over the final tree outranks the initial
    // plan's over an older one. When nothing proves it, the newest occurrence decides. Whichever
    // decides also supplies the `step`: the PASS criterion travels with the command, because an exit 1
    // from a `grep` proving no matches is a pass and only the step's own sentence says so.
    const newestFirst = [...occurrences].sort((left, right) => right.order - left.order || right.phase - left.phase);
    // One candidate per block a phase records, in the order the file writes them — a phase with no
    // block still produces exactly one, so a plan carrying one block per phase yields exactly the
    // candidate list it always did and every verdict below is byte-identical to today's.
    const judged = newestFirst.flatMap((occurrence) => {
      const blocks = occurrence.verified.get(occurrence.phase) ?? [];
      if (blocks.length === 0) return [{ occurrence, verdict: evaluate(occurrence, command, null) }];
      return blocks.map((block) => ({ occurrence, verdict: evaluate(occurrence, command, block) }));
    });
    const proofs = judged.filter((entry) => entry.verdict.decision === 'reuse');
    let selected = judged[0];
    for (const proof of proofs) {
      if (selected.verdict.decision !== 'reuse'
        || generation(repository, proof.verdict.verifiedAt, generations) > generation(repository, selected.verdict.verifiedAt, generations)) {
        selected = proof;
      }
    }
    const byPosition = [...occurrences].sort((left, right) => left.order - right.order || left.phase - right.phase);
    commands.push({
      resolved: true,
      command,
      decision: selected.verdict.decision,
      reason: selected.verdict.reason,
      plan: selected.occurrence.plan,
      phase: selected.occurrence.phase,
      step: selected.occurrence.step,
      verifiedAt: selected.verdict.verifiedAt ?? null,
      phases: byPosition.map((occurrence) => occurrence.phase),
      occurrences: byPosition.map((occurrence) => ({ plan: occurrence.plan, phase: occurrence.phase })),
    });
  }

  const report = { file, head, workersMoved, commands, unresolved };
  if (unit) report.unit = { branch: parseBranch(text), plans: sources.map((source) => source.file), abandoned };
  return report;
}

// ── What a landing can prove without re-running anything ─────────────────────
// Two provenance questions `/esq:land` and `/esq:status` ask, each answered from one recorded full
// commit and one `git diff`: is the product spec and the architecture projection still a description
// of this tree, and does a clean review still cover it. Read-only; nothing here writes or executes
// but `setReviewed`, which records the second commit and nothing else.
//
// One harmless list serves both, and it is deliberately short: the two projections themselves and
// `CLAUDE.md`, the plan and brief Markdown under `docs/plans/`, and the backlog. A refresh or a
// bookkeeping commit touches only those, so a same-day spec and arch refresh prove each other fresh
// in either order. Anything else — code, `docs/DECISIONS.md`, and every byte under `.claude/skills/`,
// `SKILL.md` included — invalidates. What it cannot do is certify prose: a hand edit to a projection
// after it was mined reads as fresh, by design, because the list admits the projection files.
const PROVENANCE_HARMLESS = new Set(['docs/SPEC.md', 'CLAUDE.md', 'docs/ARCHITECTURE.md', 'docs/BACKLOG.md']);

function provenanceHarmless(changed) {
  return PROVENANCE_HARMLESS.has(changed) || (changed.startsWith('docs/plans/') && changed.endsWith('.md'));
}

// Plans are bookkeeping for projections, but their prospective contracts are reviewable work.
// Share the verification gate's boundary: log appends and the two lifecycle headers are harmless.
function changedPlanContracts(repository, base, head = 'HEAD') {
  const names = gitTry(repository, ['diff', '--name-only', '-z', '--no-renames', base, head, '--', 'docs/plans']);
  if (names === null) return null;
  return names.split('\0').flatMap((file) => {
    if (!file.endsWith('.md') || /(?:\.brief|\.log)\.md$/.test(file) || path.basename(file) === 'README.md') return [];
    const before = gitTry(repository, ['show', `${base}:${file}`]);
    const after = gitTry(repository, ['show', `${head}:${file}`]);
    return before === null || after === null || planSection(before) !== planSection(after)
      ? [{ path: file, status: after === null ? 'D' : before === null ? 'A' : 'M' }] : [];
  });
}

// `{ ok: true, changed }` — the paths outside the harmless list since `at` — or `{ ok: false, reason }`
// when nothing can be proved. A short hash, a ref name, a commit this repository does not hold, or a
// git that will not answer each fail to prove, and never read as fresh.
function provenSince(repository, at) {
  if (typeof at !== 'string' || !FULL_OID.test(at)) {
    return { ok: false, reason: at ? `\`${at}\` is not a full 40-character commit, so it cannot prove anything` : 'no commit is recorded' };
  }
  if (!repository || !gitTry(repository, ['rev-parse', '--verify', '--quiet', `${at}^{commit}`])) {
    return { ok: false, reason: `${at.slice(0, 7)} is not a commit in this repository` };
  }
  const diff = gitTry(repository, ['diff', '--name-only', '--no-renames', at, 'HEAD']);
  if (diff === null) return { ok: false, reason: `git could not diff ${at.slice(0, 7)} against HEAD` };
  return { ok: true, changed: diff.split('\n').filter((line) => line !== '' && !provenanceHarmless(line)) };
}

// The projection markers, as their owners write them on the second line: `<!-- last-spec: <date> @
// <full commit> -->`. The commit is the HEAD the owner inspected when it mined the tree — an existing
// commit, never the refresh's own. A date alone is the legacy marker: it says when, never what.
const PROJECTIONS = [
  { name: 'spec', marker: 'last-spec', files: ['docs/SPEC.md'], owner: '/esq:spec' },
  { name: 'arch', marker: 'last-arch', files: ['docs/ARCHITECTURE.md', 'CLAUDE.md'], owner: '/esq:arch' },
];
const MARKER_BODY = /^(\d{4}-\d{2}-\d{2})(?:\s+@\s+(\S+))?$/;

function projectionMarker(text, marker) {
  for (const line of text.split('\n')) {
    const match = line.match(new RegExp(`^<!--\\s*${marker}:\\s*(.*?)\\s*-->\\s*$`));
    if (match) return { line: line.trim(), body: match[1] };
  }
  return null;
}

export async function projections(root) {
  let repository = null;
  try { repository = git(root, ['rev-parse', '--show-toplevel']); } catch { repository = null; }
  const base = repository ?? root;
  const head = repository ? gitTry(repository, ['rev-parse', 'HEAD']) : null;
  const report = [];
  for (const projection of PROJECTIONS) {
    const entry = { name: projection.name, owner: projection.owner, file: null, marker: null, date: null, at: null, verdict: 'unproven', reason: null, changed: [] };
    let legacy = false;
    for (const candidate of projection.files) {
      let text;
      try { text = await readText(path.join(base, candidate)); }
      catch { continue; }
      const found = projectionMarker(text, projection.marker);
      if (found) { entry.file = candidate; entry.marker = found.line; entry.body = found.body; break; }
      if (projectionMarker(text, 'last-synced')) legacy = true;
    }
    const body = entry.body;
    delete entry.body;
    if (!entry.marker) {
      entry.reason = legacy
        ? `only the legacy \`last-synced\` marker exists — it records a date, never a commit; run ${projection.owner}`
        : `no \`${projection.marker}\` marker in ${projection.files.join(' or ')}; run ${projection.owner}`;
      report.push(entry);
      continue;
    }
    const parsed = MARKER_BODY.exec(body);
    if (!parsed) {
      entry.reason = `${entry.file}'s marker is malformed — expected \`<!-- ${projection.marker}: YYYY-MM-DD @ <full commit> -->\`; run ${projection.owner}`;
      report.push(entry);
      continue;
    }
    entry.date = parsed[1];
    entry.at = parsed[2] ?? null;
    if (!entry.at) {
      entry.reason = `${entry.file} records a date and no commit, so it cannot prove what tree it describes; run ${projection.owner}`;
      report.push(entry);
      continue;
    }
    const since = provenSince(repository, entry.at);
    if (!since.ok) {
      entry.reason = `${entry.file}: ${since.reason}; run ${projection.owner}`;
    } else if (since.changed.length > 0) {
      entry.verdict = 'stale';
      entry.changed = since.changed;
      entry.reason = `${since.changed.length} path(s) outside the projection bookkeeping changed since ${entry.at.slice(0, 7)} — ${since.changed.slice(0, 5).join(', ')}${since.changed.length > 5 ? ', …' : ''}; run ${projection.owner}`;
    } else {
      entry.verdict = 'fresh';
      entry.reason = `nothing outside the projection bookkeeping changed since ${entry.at.slice(0, 7)}`;
    }
    report.push(entry);
  }
  return { root: repository, head, fresh: report.every((entry) => entry.verdict === 'fresh'), projections: report };
}

// Whether a clean review still covers HEAD: the plan header's `**Reviewed at:**` commit, and nothing
// outside the harmless list changed since it. `covered` / `stale` / `unproven` — `corrected` is the
// unit-level answer `unitCoverage` adds below and is never one plan header's own. A live finding in a
// brief is a separate fact (`unit.findings`) and blocks a landing on its own, whatever this says.
function reviewCoverage(repository, text) {
  const at = parseReviewedAt(text);
  const coverage = { verdict: 'unproven', reviewedAt: at, reason: null, changed: [] };
  if (!at) return { ...coverage, reason: 'the plan records no **Reviewed at:** — no clean review or converge completion has covered it' };
  const since = provenSince(repository, at);
  if (!since.ok) return { ...coverage, reason: `**Reviewed at:** ${since.reason}` };
  const contracts = changedPlanContracts(repository, at);
  if (contracts === null) return { ...coverage, reason: 'git could not compare prospective plan contracts' };
  since.changed.push(...contracts.map((entry) => entry.path));
  if (since.changed.length > 0) {
    return { ...coverage, verdict: 'stale', changed: since.changed, reason: `${since.changed.length} path(s) changed since the review at ${at.slice(0, 7)} — ${since.changed.slice(0, 5).join(', ')}${since.changed.length > 5 ? ', …' : ''}` };
  }
  return { ...coverage, verdict: 'covered', reason: `nothing but bookkeeping changed since the review at ${at.slice(0, 7)}` };
}

// The split inside `unproven`, and the whole of why it exists: two commands disagreed about what
// follows an emptied brief. A unit nobody has ever reviewed on this branch owes the full corrective
// itinerary; a unit a `/esq:review` did read, whose findings `/esq:fix` then applied and whose brief it
// cleared, owes exactly one delta review — which is what `/esq:fix`'s own `→ Next` has always handed
// back. Neither state records a `**Reviewed at:**`, so no plan header can tell them apart, and a
// landing that read them as one state sent the second to `/esq:converge`, which re-runs check → fix
// ahead of the review and can write a brief the landing then refuses on. The review's own
// brief, still in history under the `brief(fixes): <slug>` commit that wrote it, is what tells them
// apart — and `reviewBriefCandidate` is the same read `esq review scope` narrows a re-review with, so
// the routing fact and the base that answers it come from one place rather than from two readings.
//
// Asked only on the path that would otherwise be `unproven`, which is what bounds its cost: a covered
// or stale unit never pays the history walk. `from` is the brief found and read; `kept` would
// additionally demand a usable stamp, and the routing fact is the first — a review ran on this unit,
// whatever a rebase later did to the commit it stamped. A member recording a `**Reviewed at:**` this
// repository cannot resolve stays `unproven` on purpose: its baseline is gone, so there is no delta to
// scope from and a review would have to read the whole unit anyway.
function correctedCoverage(repository, members) {
  const head = gitTry(repository, ['rev-parse', '--verify', '--quiet', 'HEAD']);
  if (!head) return null;
  const generations = new Map();
  let found = null;
  for (const member of members) {
    const slug = planSlug(member.file);
    if (!REVIEW_SLUG.test(slug)) continue;
    const candidate = reviewBriefCandidate(repository, head, slug);
    if (!candidate.from) continue;
    const cut = candidate.from.indexOf(':');
    const entry = {
      plan: member.relative,
      at: candidate.commit ?? null,
      commit: candidate.from.slice(0, cut),
      brief: candidate.from.slice(cut + 1),
    };
    // Among several the newest review decides, exactly as it does among several records, so the
    // answer is the same whichever plan of the unit the caller was handed. A candidate whose stamp no
    // longer resolves cannot be ordered and never displaces one that can.
    if (!found || (entry.at && (!found.at
      || generation(repository, entry.at, generations) >= generation(repository, found.at, generations)))) found = entry;
  }
  if (!found) return null;
  return {
    verdict: 'corrected',
    reviewedAt: null,
    reason: `no plan of this unit records **Reviewed at:**, but a /esq:review read this unit — it wrote ${found.brief} at ${found.commit.slice(0, 7)} — so one delta review re-establishes coverage`,
    changed: [],
    plan: found.plan,
  };
}

// Coverage is a fact about the shipping unit, not about the plan a caller happened to name: `esq merge
// land` merges the whole branch, so a clean review recorded by any plan recording this `**Branch:**`
// covers it. `members` is `unitHeaders`' answer, oldest first. Covered when any member's record still
// covers HEAD; otherwise stale when any member's does not; otherwise unproven. Among several records of
// one verdict the newest commit decides, position breaking a tie — so the answer, `plan` included, is
// the same whichever member was passed. Before it settles for `unproven` it asks `correctedCoverage`
// whether a review ever read this unit at all, which is the difference between owing a delta review
// and owing the whole corrective itinerary. A plan in no unit keeps its own record's answer.
function unitCoverage(repository, members, text) {
  if (members.length === 0) return { ...reviewCoverage(repository, text), plan: null };
  const candidates = members.map((member) => ({ ...reviewCoverage(repository, member.text), plan: member.relative }));
  const generations = new Map();
  const newest = (list) => list.reduce((best, candidate) => (
    generation(repository, candidate.reviewedAt, generations) >= generation(repository, best.reviewedAt, generations) ? candidate : best));
  for (const verdict of ['covered', 'stale']) {
    const matching = candidates.filter((candidate) => candidate.verdict === verdict);
    if (matching.length > 0) return newest(matching);
  }
  const corrected = correctedCoverage(repository, members);
  if (corrected) return corrected;
  const recorded = candidates.filter((candidate) => candidate.reviewedAt);
  if (recorded.length > 0) return recorded.at(-1);
  return { verdict: 'unproven', reviewedAt: null, reason: 'no plan of this unit records **Reviewed at:** and no /esq:review has written a brief for one — no review has covered it', changed: [], plan: null };
}

// Whether the unit already landed. `mergedInto`'s three-state answer while the recorded branch still
// resolves. Once it does not — deleted after merging, the ordinary end of a unit — the branch can no
// longer be asked, so the plan file is: the commit that last changed it, reachable from HEAD, is an
// ancestor of the recorded origin → `true`. Two git facts, never a commit message. Anything that
// cannot be asked, or a last change the origin does not hold, stays `null`: proves nothing either way.
function unitLanded(repository, recorded, origin, planRelative) {
  if (!(recorded && origin && recorded !== origin && safeRef(recorded) && safeRef(origin))) return null;
  const merged = mergedInto(repository, recorded, origin);
  if (merged !== null) return merged;
  if (!planRelative || !gitTry(repository, ['rev-parse', '--verify', '--quiet', `${origin}^{commit}`])) return null;
  const last = gitTry(repository, ['log', '-1', '--format=%H', 'HEAD', '--', planRelative]);
  if (!last) return null;
  return gitTry(repository, ['merge-base', '--is-ancestor', last, origin]) === null ? null : true;
}

// Records `**Reviewed at:** <commit>` in the plan header, one atomic write. Structure only: it checks
// the value is a full commit this repository holds and that the plan has a header to hold it, and
// never decides whether the review was clean — the calling command already did. Re-recording the
// same commit writes nothing. The field goes after the last header field (beside `**Origin:**`), set
// off by one blank line, which is exactly the shape `planSection` leaves out of its comparison.
export async function setReviewed(root, planPath, commit) {
  if (typeof commit !== 'string' || !FULL_OID.test(commit)) {
    throw new Error('the reviewed commit must be the full 40-character object id `git rev-parse HEAD` returned — a ref that can move is a name, not provenance');
  }
  const file = path.resolve(root, planPath);
  const text = await readText(file);
  const repository = git(path.dirname(file), ['rev-parse', '--show-toplevel']);
  if (!gitTry(repository, ['rev-parse', '--verify', '--quiet', `${commit}^{commit}`])) {
    throw new Error(`${commit.slice(0, 7)} is not a commit in this repository`);
  }
  const lines = text.split('\n');
  const headerEnd = lines.findIndex((line) => /^##\s/.test(line));
  if (headerEnd < 0) throw new Error(`${planPath} has no ## heading, so it has no header to record a review in`);
  const relative = path.relative(repository, file);
  if (!placeHeaderField(lines, headerEnd, REVIEWED_AT_LINE, `**Reviewed at:** ${commit}`)) return { file: relative, reviewedAt: commit, changed: false };
  await atomicWrite(file, lines.join('\n'));
  return { file: relative, reviewedAt: commit, changed: true };
}

// One header field, in place: an existing line matching `pattern` is replaced, otherwise the field goes
// after the last header field, set off by one blank line — the shape `planSection` leaves out of its
// comparison. Returns false when the line already reads exactly `field`, so the caller writes nothing.
function placeHeaderField(lines, headerEnd, pattern, field) {
  const existing = lines.slice(0, headerEnd).findIndex((line) => pattern.test(line));
  if (existing >= 0) {
    if (lines[existing] === field) return false;
    lines[existing] = field;
    return true;
  }
  let anchor = -1;
  for (let index = headerEnd - 1; index >= 0; index -= 1) {
    if (/^\*\*[^*]+:\*\*/.test(lines[index])) { anchor = index; break; }
  }
  if (anchor < 0) {
    for (let index = headerEnd - 1; index >= 0; index -= 1) {
      if (lines[index].trim() !== '') { anchor = index; break; }
    }
  }
  lines.splice(anchor + 1, 0, '', field);
  return true;
}

// Records `**Abandoned:** <today> — <reason>` in the plan header, one atomic write, and commits nothing:
// `esq merge` is the only CLI surface that writes git history. It takes one plan of a shipping unit
// out of the unit's completeness requirement and nothing else — the rows it promised and the briefs
// naming it still block a landing. Structure only: whether to abandon is the user's decision.
//
// The reason is user text landing in a header that `parsePlan`, `headerField` and `nextPhase` read
// structurally, so a newline carrying `## Execution log` or `### Phase 2 — completed` would forge plan
// structure. Refused before the file is touched, with the predicate `appendLog` uses: empty, a newline
// or carriage return, a structural line, or over `ABANDON_REASON_MAX` characters. A plan whose every
// phase already completed shipped, so there is nothing to abandon. Every refusal leaves the file
// byte-identical. An invalid or phase-less plan can be abandoned — that is the way out of both.
const ABANDON_REASON_MAX = 200;

export async function setAbandoned(root, planPath, rawReason) {
  if (typeof rawReason !== 'string' || rawReason.trim() === '') throw new Error('--reason is required and cannot be empty — abandonment is a recorded decision, and the reason is the record');
  if (/[\r\n]/.test(rawReason)) throw new Error('--reason must be one line — a newline could forge plan structure in the header');
  const reason = rawReason.trim();
  if (STRUCTURAL_LINE.test(reason)) throw new Error('--reason cannot open with a heading or a **field:** — it lands in the plan header, which is read structurally');
  if (reason.length > ABANDON_REASON_MAX) throw new Error(`--reason is ${reason.length} characters; at most ${ABANDON_REASON_MAX}`);
  const file = path.resolve(root, planPath);
  const text = await readText(file);
  const repository = git(path.dirname(file), ['rev-parse', '--show-toplevel']);
  let complete = false;
  try {
    const parsed = parsePlan(text);
    complete = parsed.phases.length > 0 && nextPhase(parsed).state === 'complete';
  } catch { complete = false; }
  if (complete) throw new Error(`${planPath} has every phase completed — it shipped, so there is nothing to abandon`);
  const lines = text.split('\n');
  const headerEnd = lines.findIndex((line) => /^##\s/.test(line));
  if (headerEnd < 0) throw new Error(`${planPath} has no ## heading, so it has no header to record abandonment in`);
  const date = new Date().toISOString().slice(0, 10);
  const relative = path.relative(repository, file);
  const abandoned = { date, reason };
  if (!placeHeaderField(lines, headerEnd, ABANDONED_LINE, `**Abandoned:** ${date} — ${reason}`)) return { file: relative, abandoned, changed: false };
  await atomicWrite(file, lines.join('\n'));
  return { file: relative, abandoned, changed: true };
}

// ── The scope a review reads ─────────────────────────────────────────────────
// Read-only, writes nothing, executes nothing it returns, and always exits 0: what `/esq:review`
// must read, resolved once from a single pinned `HEAD`. It replaces a 387-word procedure the model
// re-walked at every review — eleven metadata subject prefixes, a `brief(fixes): <slug>` history
// grep, a `git show` of a brief out of a commit that may since have deleted it, an exact `Source:`
// comparison, a second anchored grep, a header field read out of a third commit, two ancestry checks
// and a newer-of-two pick, then the changed paths (D-review-scope-is-one-deterministic-query).
//
// THE RULE IS NOT NEW, AND NOTHING HERE DECIDES ANYTHING. The delta rule is
// `D-review-delta-base-is-a-reviews-own-record` verbatim: the base is the newest commit *a review
// itself read*, which is one of exactly two candidates, and a `plan(converged):` record is never one
// of them because `/esq:converge`'s record covers final fix commits no review read. What is in scope,
// what clears the review bar and whether a review is clean stay the model's
// (D-cli-owns-structure-model-owns-judgment) — this verb resolves a range and reports facts.
//
// EVERY FAILURE WIDENS. A stamp git cannot resolve, a candidate rewritten by a rebase, a `Source:`
// naming another plan, a brief commit whose brief is unreadable, a grep that cannot run: each drops
// its candidate and the answer falls back to full scope, never to a narrower one and never to an
// empty diff. `mode: 'unresolved'` is the one answer with no range at all, and it carries
// `paths: null` rather than `[]` precisely so a caller cannot read a failure as a clean review.
//
// HEAD IS PINNED ONCE, at the top, and every fact below is read against that object id — the log,
// both greps, every ancestry question and the diff. A verb that re-read `HEAD` could answer with a
// base resolved against one tree and paths resolved against another.

// The eleven subject prefixes that are workflow bookkeeping rather than an implementation commit, as
// review's preflight has always listed them. Matched on the subject's start: `docs(build):` is
// implementation and `docs(arch):` is not, which is why the two are spelled out rather than reduced
// to `docs(`.
const REVIEW_METADATA_SUBJECTS = ['plan:', 'plan(', 'brief', 'backlog:', 'decisions:', 'epic:', 'roadmap:', 'spec:', 'merge:', 'docs(claude):', 'docs(arch):'];

// Exclude bookkeeping from the main diff. Changed prospective plan contracts are added separately
// by reviewRangeFacts; briefs and historical proof appends alone still cost no review.
const REVIEW_EXCLUDED = [':!docs/plans', ':!docs/BACKLOG.md', ':!docs/DECISIONS.md'];

// A corrective brief's own header, and the comma is load-bearing: it ends the slug, so a
// `<slug>-fixes` brief never answers for `<slug>` and a hit naming any other plan is dropped. This is
// stricter than `BRIEF_SOURCE`, which serves `unit.findings` and has no delimiter to enforce because
// it reads live files rather than deciding how far back a review may narrow.
const REVIEW_BRIEF_SOURCE = /^Source:\s*\/esq:(check|review)\s+on\s+([^,\s]+),/m;
const REVIEW_BRIEF_STAMP = /^Reviewed at:[ \t]*`?([0-9a-f]{7,40})`?[ \t]*$/m;

// A slug reaching a `--grep` pattern. The canonical plan slug is lowercase, digits and hyphens by
// construction; anything else is refused rather than interpolated, because a grep pattern is the one
// place in this verb where a plan filename would stop being data.
const REVIEW_SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

// At most this many corrective briefs are opened looking for one whose `Source:` names exactly this
// plan. Bounded because the scan issues a subprocess per brief, and safe at any bound: stopping early
// can only lose a candidate, which widens the review.
const REVIEW_BRIEF_SCAN = 10;

// The three delimiters this section hands git and reads back. Control characters, because a commit
// subject, a brief path and a repository path may each legally contain a newline, a tab or a space:
// SOH separates one `git log` block from the next, US separates a hash from its subject, and NUL is
// what `git diff -z` writes between fields. None of the three can occur in git's own output.
const BLOCK_DELIMITER = '\u0001';
const FIELD_US = '\u001f';
const FIELD_NUL = '\u0000';

function reviewMetadata(subject) {
  return REVIEW_METADATA_SUBJECTS.some((prefix) => subject.startsWith(prefix));
}

// `<commit>` to the full object id git resolves it to, or null. A short hash out of a brief, a full one
// out of a plan header: both come back the same way, and neither is trusted to exist.
function reviewCommit(repository, value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{7,40}$/.test(value)) return null;
  return gitTry(repository, ['rev-parse', '--verify', '--quiet', `${value}^{commit}`]);
}

function reviewAncestor(repository, candidate, of) {
  return gitTry(repository, ['merge-base', '--is-ancestor', candidate, of]) !== null;
}

// `git log --format=%x01%H --name-only` as blocks: one record per commit, led by the US-free delimiter
// git wrote, its hash on the first line and its files on the rest. Parsed rather than run per commit,
// so the whole candidate scan costs one subprocess plus one `git show` per brief actually opened.
function reviewLogBlocks(log) {
  return log.split(BLOCK_DELIMITER).slice(1).map((block) => {
    const lines = block.split('\n').filter((line) => line.trim() !== '');
    const [commit, subject = ''] = (lines[0] ?? '').split(FIELD_US);
    return { commit: commit || null, subject, files: lines.slice(1).map((line) => line.trim()) };
  }).filter((block) => block.commit !== null);
}

// Candidate (a): the newest `brief(fixes): <slug>` commit carrying a brief whose `Source:` names
// exactly this plan's slug, and that brief's `Reviewed at:` stamp. One candidate per source and no
// fallback within it — an older brief is not consulted when the newest one's stamp cannot be used,
// because the contract compares two candidates and full scope is what it falls back to.
//
// The subject is re-read out of each block and matched again, because `--grep` searches the whole
// commit message: without this a body line reading `brief(fixes): <slug>` under any subject at all
// would supply a candidate, and a candidate is a thing that *narrows* a review. The grep is the cheap
// prefilter; the subject and the brief's `Source:` are the identity (D-review-delta-base-is-a-reviews-own-record).
function reviewBriefCandidate(repository, head, slug) {
  const candidate = { source: 'review-brief', from: null, at: null, commit: null, kept: false, reason: null };
  const log = gitTry(repository, ['log', head, `--grep=brief(fixes): ${slug}`, `--format=%x01%H${FIELD_US}%s`, '--name-only']);
  if (log === null) return { ...candidate, reason: `git could not search history for a \`brief(fixes): ${slug}\` commit` };
  const blocks = reviewLogBlocks(log);
  if (blocks.length === 0) return { ...candidate, reason: `no \`brief(fixes): ${slug}\` commit is reachable from ${head.slice(0, 7)}` };
  let examined = 0;
  for (const block of blocks) {
    if (!block.subject.startsWith(`brief(fixes): ${slug}`)) continue;
    for (const file of block.files) {
      if (!CORRECTIVE_BRIEF.test(path.basename(file))) continue;
      if (examined >= REVIEW_BRIEF_SCAN) {
        return { ...candidate, reason: `the ${REVIEW_BRIEF_SCAN} newest corrective briefs under \`brief(fixes): ${slug}\` name another plan in their \`Source:\`` };
      }
      examined += 1;
      const text = gitTry(repository, ['show', `${block.commit}:${file}`]);
      if (text === null) continue;
      const source = REVIEW_BRIEF_SOURCE.exec(text);
      if (!source || source[1] !== 'review') continue;
      if (normalizeSlug(source[2].replace(/\.md$/, '')) !== slug) continue;
      // Found the candidate. Whatever happens to its stamp from here, no older brief is consulted.
      const found = { ...candidate, from: `${block.commit}:${file}` };
      const stamp = REVIEW_BRIEF_STAMP.exec(text);
      if (!stamp) return { ...found, reason: `${file} at ${block.commit.slice(0, 7)} records no \`Reviewed at:\` stamp` };
      const resolved = reviewCommit(repository, stamp[1]);
      if (!resolved) return { ...found, at: stamp[1], reason: `its \`Reviewed at: ${stamp[1]}\` is not a commit in this repository — a rebase or a squash rewrote it` };
      return { ...found, at: stamp[1], commit: resolved, kept: true, reason: `\`Reviewed at:\` in ${file}, committed as \`brief(fixes): ${slug}\`` };
    }
  }
  return { ...candidate, reason: `no \`brief(fixes): ${slug}\` commit carried a brief whose \`Source:\` names exactly \`${slug}\`` };
}

// Candidate (b): the `**Reviewed at:**` field recorded by the newest `plan(reviewed): <slug> at `
// commit. Anchored at the start and closed by ` at `, which is the whole of why a `<slug>-fixes`
// record never answers for `<slug>` — and why a `plan(converged):` record, which `/esq:converge`
// commits under its own subject precisely so this cannot see it, is not a candidate at all.
function reviewRecordCandidate(repository, head, slug, planRelative) {
  const candidate = { source: 'clean-review', from: null, at: null, commit: null, kept: false, reason: null };
  const subject = `plan(reviewed): ${slug} at `;
  const log = gitTry(repository, ['log', `--grep=^${subject}`, `--format=%H${FIELD_US}%s`, head]);
  if (log === null) return { ...candidate, reason: `git could not search history for a \`${subject}\` commit` };
  // Newest first, and the *subject* decides — `--grep` matched the whole message, so a body line
  // carrying this text under another subject is not a clean review's record.
  const commit = (log === '' ? [] : log.split('\n'))
    .map((line) => line.split(FIELD_US))
    .find(([, text = '']) => text.startsWith(subject))?.[0];
  if (!commit) return { ...candidate, reason: `no commit whose subject is \`${subject}…\` is reachable from ${head.slice(0, 7)} — no clean review has recorded coverage` };
  const from = `${commit}:${planRelative}`;
  const text = gitTry(repository, ['show', from]);
  if (text === null) return { ...candidate, from, reason: `${planRelative} could not be read at ${commit.slice(0, 7)}` };
  const at = parseReviewedAt(text);
  if (!at) return { ...candidate, from, reason: `${planRelative} at ${commit.slice(0, 7)} records no **Reviewed at:** field` };
  const resolved = reviewCommit(repository, at);
  if (!resolved) return { ...candidate, from, at, reason: `its **Reviewed at:** ${at.slice(0, 7)} is not a commit in this repository — a rebase or a squash rewrote it` };
  return { ...candidate, from, at, commit: resolved, kept: true, reason: `**Reviewed at:** in ${planRelative}, committed as \`plan(reviewed): ${slug} at \`` };
}

// The base a full review reads from: the commit the plan itself was committed in, everything after it
// being the unit's work. Cheapest source first and no archaeology — the execution log's own
// `**Plan committed at:**` needs no history search, and the `plan: <slug>` commit is the fallback the
// preflight has always named.
function reviewFullBase(repository, head, slug, text) {
  const logged = text.match(/^\*\*Plan committed at:\*\*[ \t]*`?([0-9a-f]{7,40})`?[ \t]*$/m);
  if (logged) {
    const resolved = reviewCommit(repository, logged[1]);
    if (resolved && reviewAncestor(repository, resolved, head)) {
      return { commit: resolved, provenance: 'plan-commit', reason: `${logged[1]}, the **Plan committed at:** its execution log records` };
    }
  }
  // Same rule as the two candidate reads, and for the same reason: `--grep` searches the whole commit
  // message, so the subject is asked again. A base taken off a body line would be a range nobody chose.
  const subject = `plan: ${slug}`;
  const log = gitTry(repository, ['log', `--grep=^${subject}$`, `--format=%H${FIELD_US}%s`, head]);
  const commit = (log ? log.split('\n') : [])
    .map((line) => line.split(FIELD_US))
    .find(([, text = '']) => text === subject)?.[0];
  if (commit) return { commit, provenance: 'plan-commit', reason: `${commit.slice(0, 7)}, its \`${subject}\` commit` };
  return { commit: null, provenance: null, reason: `no **Plan committed at:** in the execution log resolves, and no \`plan: ${slug}\` commit is reachable from ${head.slice(0, 7)}` };
}

// `git diff --name-status -z` as records. `-z` is not a detail: it turns off git's quoting of unusual
// paths entirely, so a path with a space, a quote or a non-ASCII byte comes back as its own bytes
// instead of a C-escaped string this would have to unescape. A rename or copy carries two paths, and
// both are reported — the old one under `from`, so a reviewer reading the diff knows what moved.
function reviewPaths(record) {
  const fields = record.split(FIELD_NUL).filter((field) => field !== '');
  const paths = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index];
    if (/^[RC]/.test(status) && fields[index + 2] !== undefined) {
      paths.push({ status, path: fields[index + 2], from: fields[index + 1] });
      index += 3;
      continue;
    }
    if (fields[index + 1] === undefined) break;
    paths.push({ status, path: fields[index + 1] });
    index += 2;
  }
  return paths;
}

export async function reviewScope(root, planPath, { full = false } = {}) {
  const text = await readText(path.resolve(root, planPath));
  let repository = null;
  try { repository = git(root, ['rev-parse', '--show-toplevel']); } catch { repository = null; }
  const file = repository ? (path.relative(repository, path.resolve(root, planPath)) || planPath) : planPath;
  const slug = planSlug(file);
  const head = repository ? gitTry(repository, ['rev-parse', '--verify', '--quiet', 'HEAD']) : null;
  const answer = { root: repository, file, slug, head, mode: 'unresolved', base: null, provenance: null, reason: null, candidates: [], commits: null, excluded: null, bookkeepingOnly: null, paths: null, diff: null };
  if (!repository || !head) return { ...answer, reason: 'git could not be read here, so no commit range can be resolved — review the whole change and say so' };
  if (!REVIEW_SLUG.test(slug)) {
    return { ...answer, reason: `\`${slug}\` is not a plan slug this can search history for — review the whole change and say so` };
  }

  // The candidates, and the pick. Skipped entirely under `--full`: the user asked for the whole
  // change, so the two greps and their `git show` calls would be spent to be discarded.
  let base = null;
  let provenance = null;
  let reason = null;
  const candidates = [];
  if (!full) {
    candidates.push(reviewBriefCandidate(repository, head, slug), reviewRecordCandidate(repository, head, slug, file));
    for (const candidate of candidates) {
      if (candidate.kept && !reviewAncestor(repository, candidate.commit, head)) {
        candidate.kept = false;
        candidate.reason = `${candidate.commit.slice(0, 7)} is no ancestor of ${head.slice(0, 7)} — a rebase rewrote it`;
      }
    }
    const kept = candidates.filter((candidate) => candidate.kept);
    // The newer of what is left is the one every other kept candidate is an ancestor of. Two
    // candidates neither of which reaches the other are incomparable, and picking either would skip
    // the commits only the other covers — so that answers full scope, named, rather than narrowing.
    const newest = kept.find((candidate) => kept.every((other) => other === candidate || reviewAncestor(repository, other.commit, candidate.commit)));
    if (kept.length > 0 && !newest) {
      reason = `${kept.length} review baselines are reachable and none is an ancestor of the others, so narrowing to any one of them would skip what the others cover`;
    } else if (newest) {
      base = newest.commit;
      provenance = newest.source;
      reason = `${newest.source === 'review-brief' ? 'a review brief' : 'a clean review'} read ${base.slice(0, 7)} — ${newest.reason}`;
    }
  }

  // No base means full scope, which needs the plan's own commit. Resolved only here, because a delta
  // never asks the question.
  let mode = 'delta';
  if (!base) {
    mode = 'full';
    const fallback = reviewFullBase(repository, head, slug, text);
    if (!fallback.commit) {
      const why = full
        ? 'a full re-review was requested'
        : (reason ?? candidates.map((candidate) => candidate.reason).filter(Boolean).join('; '));
      return { ...answer, candidates, reason: `${why}, and the plan's own commit cannot be resolved either: ${fallback.reason} — review the whole change and say so` };
    }
    base = fallback.commit;
    provenance = full ? 'requested-full' : fallback.provenance;
    reason = full
      ? `a full re-review was requested, so the range is the whole unit from ${fallback.reason}`
      : `${reason ?? 'no review baseline is usable'}, so the range is the whole unit from ${fallback.reason}`;
  }

  return reviewRangeFacts(repository, base, head, { ...answer, mode, provenance, reason, candidates });
}

// Everything a review needs once a base and a head are settled, whichever way they were settled — a
// plan's own history, or a range the caller named. `answer` carries the shape's defaults plus
// whatever the resolution already knows.
function reviewRangeFacts(repository, base, head, answer) {
  const log = gitTry(repository, ['log', `${base}..${head}`, `--format=%H${FIELD_US}%s`]);
  if (log === null) {
    return { ...answer, base, reason: `git could not list ${base.slice(0, 7)}..${head.slice(0, 7)} — review the whole change and say so`, mode: 'unresolved' };
  }
  const listed = log === '' ? [] : log.split('\n').map((line) => {
    const [commit, subject = ''] = line.split(FIELD_US);
    return { commit, subject };
  });
  const commits = listed.filter((entry) => !reviewMetadata(entry.subject));
  const changed = gitTry(repository, ['diff', '--name-status', '-z', base, head, '--', '.', ...REVIEW_EXCLUDED]);
  if (changed === null) {
    return { ...answer, base, reason: `git could not diff ${base.slice(0, 7)} against ${head.slice(0, 7)} — review the whole change and say so`, mode: 'unresolved' };
  }
  const pathspec = ['.', ...REVIEW_EXCLUDED.map(shellQuote)].join(' ');
  const contracts = changedPlanContracts(repository, base, head);
  if (contracts === null) return { ...answer, base, mode: 'unresolved', reason: 'git could not compare prospective plan contracts' };
  const contractDiff = contracts.length === 0 ? ''
    : ` && git diff ${base} ${head} -- ${contracts.map(({ path: file }) => shellQuote(`:(literal)${file}`)).join(' ')}`;

  return {
    ...answer,
    base,
    head,
    commits,
    excluded: listed.length - commits.length,
    // Metadata subjects cannot hide a changed plan contract; log-only bookkeeping stays cheap.
    bookkeepingOnly: commits.length === 0 && contracts.length === 0,
    paths: [...reviewPaths(changed), ...contracts],
    diff: `git diff ${base} ${head} -- ${pathspec}${contractDiff}`,
  };
}

// `esq review scope <A>..<B>` / `<ref>` — the same facts for a change that has no plan file.
//
// WHY IT EXISTS. `/esq:work`'s inline verdict used to write a plan anchor whose only job was to give
// the corrective loop something to aim at: four sections and an execution-log entry, produced so the
// finders could resolve a target. The anchor is gone (2026-09-22), and this is what replaces it —
// nothing is written, and the review reads the commits the user names. A single ref means "that
// commit alone" (`<ref>^..<ref>`), which is the shape a one-commit inline fix takes.
//
// It resolves NO baseline of its own: the bound is the caller's, honored exactly as given. **Choosing
// a bound that includes the work under review is therefore the caller's job, and `/esq:fix` is where
// that matters** — handing back the range a first review read would show the defect rather than the
// correction applied to it, so the fix pairs that range's base with its own last commit. Nothing here
// widens a range on a caller's behalf; an explicit bound that means "the code as it was" is a valid
// thing to ask for.
//
// It records NO coverage: there is no plan to record it in, so a review run this way ends where it ends. `/esq:land` is plan-based and is not its next step — an
// unplanned fix on a branch that carries no plan is not a shipping unit, and inventing one here
// would be the anchor again under another name.
export async function reviewScopeRange(root, spec) {
  let repository = null;
  try { repository = git(root, ['rev-parse', '--show-toplevel']); } catch { repository = null; }
  const answer = { root: repository, file: null, slug: null, head: null, mode: 'unresolved', base: null, provenance: 'named-range', reason: null, candidates: [], commits: null, excluded: null, bookkeepingOnly: null, paths: null, diff: null };
  if (!repository) return { ...answer, reason: 'git could not be read here, so no commit range can be resolved' };

  const dots = spec.indexOf('..');
  const [from, to] = dots >= 0 ? [spec.slice(0, dots), spec.slice(dots + 2)] : [`${spec}^`, spec];
  const base = gitTry(repository, ['rev-parse', '--verify', '--quiet', `${from}^{commit}`]);
  const head = gitTry(repository, ['rev-parse', '--verify', '--quiet', `${(to || 'HEAD')}^{commit}`]);
  if (!base) return { ...answer, reason: `\`${from}\` does not resolve to a commit in this repository` };
  if (!head) return { ...answer, reason: `\`${to || 'HEAD'}\` does not resolve to a commit in this repository` };

  return reviewRangeFacts(repository, base, head, {
    ...answer,
    head,
    mode: 'range',
    reason: dots >= 0
      ? `the range \`${spec}\` was named on the command line — nothing else scoped this review`
      : `\`${spec}\` names one commit, so the range is that commit alone`,
  });
}

// ── Harness evidence ─────────────────────────────────────────────────────────
// `docs/EVIDENCE.md` registers every billed measurement this repository rests on. This section answers
// one question per claim — was the evidence under it measured on the Claude Code you are running — and
// answers it mechanically: an exact string comparison between two recorded versions, never a guess.
// The judgment it deliberately does not make is the session's own model; that stays with the relay
// skill, which is the only thing that can read it.
//
// Reads only. The one subprocess is `claude --version` — argv array, `shell: false`, hard-bounded in
// time and bytes, no registry-derived input — and every way it can fail collapses to `unknown` rather
// than to green. `validate` calls this with `readVersion: false` and so spawns nothing at all: it runs
// on every session stop, and staleness is a fact about the machine, not a defect in the tree.

const EVIDENCE_FILE = 'docs/EVIDENCE.md';
const EVIDENCE_DIR = 'docs/evidence';
const EVIDENCE_COLUMNS = ['Measurement', 'Claim', 'Governs', 'Capture', 'Version', 'Measured', 'Refreshed by', 'State'];
// Closed sets, both of them. A `State` outside this one makes its row malformed, which makes its claim
// `unknown`; a `Governs` outside it does the same, so a typo can never quietly gate a relay — and can
// never quietly stop gating one either.
const EVIDENCE_STATES = ['current', 'superseded', 'never-measured'];
const EVIDENCE_GOVERNS = ['model-routing'];
const EMPTY_CELL = new Set(['', '—', '–', '-']);
const EVIDENCE_ID = /^[ME]-[A-Za-z0-9][A-Za-z0-9-]*$/;
// The bound on the one subprocess, stated here rather than at the call site: 2 s and 4 KB is far more
// than `claude --version` needs and far less than a hung binary costs a session stop.
const VERSION_TIMEOUT_MS = 2_000;
const VERSION_MAX_BYTES = 4096;
const VERSION_PATTERN = /\b(\d+\.\d+\.\d+)\b/;

// Exported because a maintainer's freeze path needs the same version, read the same
// bounded way. One definition, one subprocess shape, one set of failure collapses — a second `claude
// --version` in the tree would be a second thing to keep bounded, which is the rule this file already
// applies to `PLAN_SLUG_SHAPE`, `REPO_KEY_SHAPE` and `repoKey`.
export function readInstalledClaudeVersion() {
  // Under test the version is fabricated through the same seam pattern as `ESQ_TEST_GIT_ROOT`, and no
  // `claude` is ever executed — a suite that spawned the real binary would measure the machine it runs
  // on instead of the case it states. Unset means unreadable, which is the `unknown` path.
  if (process.env.NODE_ENV === 'test') {
    const stub = process.env.ESQ_TEST_CLAUDE_VERSION;
    return stub ? { version: stub, reason: null } : { version: null, reason: 'claude --version was not read' };
  }
  let result;
  try {
    result = spawnSync('claude', ['--version'], { encoding: 'utf8', shell: false, timeout: VERSION_TIMEOUT_MS, maxBuffer: VERSION_MAX_BYTES, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) { return { version: null, reason: `claude --version could not be spawned: ${error.code ?? error.message}` }; }
  if (result.error) return { version: null, reason: `claude --version failed: ${result.error.code ?? result.error.message}` };
  if (result.status !== 0) return { version: null, reason: `claude --version exited ${result.status}` };
  const match = VERSION_PATTERN.exec(String(result.stdout ?? ''));
  return match ? { version: match[1], reason: null } : { version: null, reason: 'claude --version printed no recognizable version' };
}

// A `Capture` cell is attacker-shaped text as far as this reader is concerned — the registry is a file
// in a public repository. A path is accepted only if it is repo-relative, carries no `..` segment and
// no leading separator, and still resolves inside the root; anything else is refused before any read,
// so no registry content can make the CLI open a file outside the repository.
function capturePath(root, cell) {
  if (EMPTY_CELL.has(cell)) return { reason: 'names no capture' };
  if (path.isAbsolute(cell) || /^[\\/]/.test(cell)) return { reason: `names a capture path that is not repo-relative: ${cell}` };
  const segments = cell.split(/[\\/]/);
  if (segments.includes('..')) return { reason: `names a capture path that escapes the repository: ${cell}` };
  const resolved = path.resolve(root, cell);
  const relative = path.relative(root, resolved);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) return { reason: `names a capture path that escapes the repository: ${cell}` };
  return { file: resolved };
}

// What version did the capture record for *itself*. Both billed record shapes carry it — `init.
// claude_code_version` where the harness init event was reduced, `cc` where only the judge columns
// were — and a capture that recorded two different versions is not one measurement, which is exactly
// what the probe's per-row `cc` column exists to make visible.
function captureVersion(text) {
  const versions = new Set();
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    let record;
    try { record = JSON.parse(line); } catch { return { error: 'is not readable as JSONL' }; }
    const value = record?.init?.claude_code_version ?? record?.cc;
    if (typeof value === 'string' && value !== '') versions.add(value);
  }
  if (versions.size === 0) return { error: 'records no Claude Code version' };
  if (versions.size > 1) return { error: `records more than one Claude Code version (${[...versions].sort().join(', ')})` };
  return { version: [...versions][0] };
}

// Total by construction: never throws past a missing git root, never exits nonzero, and every degenerate
// case — no registry, an unreadable table, a malformed row, an unreadable `claude` — arrives as a shaped
// verdict rather than as a failure the caller has to interpret. `readVersion: false` is `validate`'s.
export async function evidence(root, { readVersion = true } = {}) {
  const repository = git(root, ['rev-parse', '--show-toplevel']);
  const findings = [];
  const note = (message) => findings.push(`${EVIDENCE_FILE}: ${message}`);
  let present = false;
  let rows = null;
  try {
    const table = tableAt((await readText(path.join(repository, EVIDENCE_FILE))).split('\n'), 'Measurement');
    present = true;
    const missing = EVIDENCE_COLUMNS.filter((name) => !table.header.includes(name));
    if (missing.length) note(`registry table is missing the column(s) ${missing.join(', ')}`);
    else rows = table.rows.map((row) => Object.fromEntries(EVIDENCE_COLUMNS.map((name) => [name, row[table.header.indexOf(name)] ?? ''])));
  } catch (error) {
    // Absent is green and silent — a repository that registers no measurements has none to be stale.
    // Present but unparsable is a finding, and leaves every claim unknown rather than fresh.
    if (error.code !== 'ENOENT') { present = true; note(error.message); }
  }

  const seen = new Set();
  const entries = [];
  for (const row of rows ?? []) {
    const measurement = row.Measurement;
    const faults = [];
    if (!EVIDENCE_ID.test(measurement) || !measurement.startsWith('M-')) faults.push(`invalid measurement ID: ${measurement || '(empty)'}`);
    else if (seen.has(measurement)) faults.push(`duplicate measurement ID: ${measurement}`);
    seen.add(measurement);
    if (!EVIDENCE_ID.test(row.Claim) || !row.Claim.startsWith('E-')) faults.push(`invalid claim ID on ${measurement}: ${row.Claim || '(empty)'}`);
    if (!EVIDENCE_STATES.includes(row.State)) faults.push(`invalid state on ${measurement}: ${row.State || '(empty)'}`);
    const governs = EMPTY_CELL.has(row.Governs) ? null : row.Governs;
    if (governs !== null && !EVIDENCE_GOVERNS.includes(governs)) faults.push(`invalid governs on ${measurement}: ${row.Governs}`);
    let capture = null;
    if (row.State === 'never-measured') {
      if (!EMPTY_CELL.has(row.Capture)) faults.push(`${measurement} is never-measured but names a capture`);
      if (!EMPTY_CELL.has(row.Version)) faults.push(`${measurement} is never-measured but records a version`);
    } else {
      const located = capturePath(repository, row.Capture);
      if (located.reason) faults.push(`${measurement} ${located.reason}`);
      else {
        capture = row.Capture;
        let text = null;
        try { text = await readText(located.file); }
        catch { faults.push(`${measurement} names a capture that cannot be read: ${row.Capture}`); }
        if (text !== null) {
          const recorded = captureVersion(text);
          if (recorded.error) faults.push(`${measurement}'s capture ${recorded.error}`);
          else if (EMPTY_CELL.has(row.Version)) faults.push(`${measurement} records no version, but its capture records ${recorded.version}`);
          else if (recorded.version !== row.Version) faults.push(`${measurement} records ${row.Version}, but its capture records ${recorded.version}`);
        }
      }
    }
    for (const fault of faults) note(fault);
    entries.push({
      measurement, claim: row.Claim, governs, capture, state: row.State, malformed: faults.length > 0,
      version: EMPTY_CELL.has(row.Version) ? null : row.Version,
      measured: EMPTY_CELL.has(row.Measured) ? null : row.Measured,
      refreshedBy: EMPTY_CELL.has(row['Refreshed by']) ? null : row['Refreshed by'],
    });
  }

  const installed = readVersion ? readInstalledClaudeVersion() : { version: null, reason: 'not read — validate spawns no subprocess' };

  const claims = [];
  for (const claim of [...new Set(entries.map((entry) => entry.claim))]) {
    const own = entries.filter((entry) => entry.claim === claim);
    // A claim governs `model-routing` if *any* of its rows says so — the conservative direction, since
    // governing is what can stop a relay and losing it is what would let one spawn blind.
    const governs = own.find((entry) => entry.governs !== null)?.governs ?? null;
    const current = own.filter((entry) => entry.state === 'current');
    let selected = null;
    let verdict;
    let reason;
    if (own.some((entry) => entry.malformed)) {
      verdict = 'unknown';
      reason = 'a row for this claim is malformed';
    } else if (current.length > 1) {
      verdict = 'unknown';
      reason = `${current.length} rows for this claim are marked current`;
      note(`claim ${claim} has ${current.length} current measurements`);
    } else if (current.length === 0) {
      if (own.length === 1 && own[0].state === 'never-measured') {
        selected = own[0];
        verdict = 'never-measured';
        reason = 'no measurement has been taken';
      } else {
        verdict = 'unknown';
        reason = 'no row for this claim is marked current';
        note(`claim ${claim} has no current measurement`);
      }
    } else {
      selected = current[0];
      if (!selected.version) { verdict = 'unknown'; reason = 'the current measurement records no version'; }
      else if (!installed.version) { verdict = 'unknown'; reason = installed.reason; }
      else if (selected.version === installed.version) { verdict = 'fresh'; reason = `measured on ${selected.version}, which is installed`; }
      else { verdict = 'stale'; reason = `measured on ${selected.version}, installed is ${installed.version}`; }
    }
    const record = {
      claim, governs, verdict, reason, measurements: own.length,
      measurement: selected?.measurement ?? null, capture: selected?.capture ?? null,
      version: selected?.version ?? null, measured: selected?.measured ?? null,
      refreshedBy: selected?.refreshedBy ?? own.find((entry) => entry.refreshedBy)?.refreshedBy ?? null,
    };
    claims.push(record);
  }

  // A capture written but never activated would otherwise leave its claim permanently stale with the
  // replacement sitting right there. A missing directory is zero unregistered captures, never a finding.
  const named = new Set(entries.map((entry) => entry.capture).filter(Boolean));
  const unregistered = [];
  try {
    for (const name of await readdir(path.join(repository, EVIDENCE_DIR))) {
      const relative = `${EVIDENCE_DIR}/${name}`;
      if (!named.has(relative)) unregistered.push(relative);
    }
  } catch (error) { if (error.code !== 'ENOENT') findings.push(`${EVIDENCE_DIR} is unreadable: ${error.message}`); }
  unregistered.sort();

  return { root: repository, registry: EVIDENCE_FILE, present, installed, claims, unregistered, findings };
}

export function renderEvidence(report) {
  const lines = [`Harness evidence — ${report.registry}${report.present ? '' : ' (absent)'}`];
  lines.push(`Installed Claude Code: ${report.installed.version ?? `unknown (${report.installed.reason})`}`);
  lines.push('');
  if (report.claims.length === 0) lines.push('  no claims registered');
  for (const claim of report.claims) {
    lines.push(`  ${claim.verdict.padEnd(15)}${claim.claim}${claim.governs ? ` · governs ${claim.governs}` : ''} — ${claim.reason}`);
    if (claim.verdict !== 'fresh' && claim.refreshedBy) lines.push(`  ${' '.repeat(15)}refresh: ${claim.refreshedBy}`);
  }
  lines.push('');
  if (report.unregistered.length) lines.push(`Unregistered captures (written, never activated): ${report.unregistered.join(', ')}`);
  lines.push('');
  lines.push(report.findings.length ? `Findings (${report.findings.length}):` : 'Findings: none.');
  for (const finding of report.findings) lines.push(`  - ${finding}`);
  return `${lines.join('\n')}\n`;
}


// ---------------------------------------------------------------------------
// Merge — the one engine every esquisse landing runs, attended or not.
//
// `/esq:worktree merge` drove `git merge --no-ff --no-commit` from skill prose; an unattended
// landing cannot, so the git half moves here and both paths call it (docs/plans/2026-09-01-
// loop-lands-its-branch.md). What lives in this section is mechanism only — hold the merge, report
// what git raised, classify a duplicate against the merge base, undo it all. Every judgment call —
// which side's free text wins, whether a conflicted file is the user's to resolve — stays with the
// caller (D-cli-owns-structure-model-owns-judgment).

// The two files this system reconciles. Everything else git raised is the caller's.
const LEDGERS = ['docs/BACKLOG.md', 'docs/DECISIONS.md'];

// Branch names reach git as argv elements through `spawnSync`, never as a shell string, and every
// ref this section builds is prefixed (`refs/heads/<name>`) so no argument can begin with `-` and be
// read as a flag. This guard is the second layer: a name git itself would refuse is refused here
// first, before it reaches an argv at all. The plan's `**Branch:**` field is model-written text in a
// file, which is why the layer exists.
function safeRef(name) {
  if (typeof name !== 'string' || name === '' || name.length > 255) return false;
  if (/^-|\.\.|@\{|\.lock$|\/\/|^\/|\/$|\.$/.test(name)) return false;
  return !/[\s~^:?*[\\]/.test(name);
}

// A total probe: a status code and both streams, never a throw. `git()` above is the read path and
// raises on a nonzero exit, which is wrong for a merge — `git merge` exits 1 on the conflicts this
// command exists to report, and that is an outcome, not a failure.
function gitRun(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  if (result.error) return { status: null, stdout: '', stderr: String(result.error.message) };
  return { status: result.status, stdout: (result.stdout ?? '').trim(), stderr: (result.stderr ?? '').trim() };
}

// The value, or `null` when the command failed. `''` is a real answer (a clean `status --porcelain`)
// and is never conflated with failure.
function gitOut(root, args) {
  const { status, stdout } = gitRun(root, args);
  return status === 0 ? stdout : null;
}

// A path inside a command a human will paste into a terminal. Single quotes stop every shell
// metacharacter a directory name may legally carry — a space, a `$`, a `;` — and an embedded single
// quote is closed, escaped and reopened, which is the one sequence single quoting cannot swallow.
// Nothing in this file ever hands a path to a shell; this is only for the line that is printed.
function shellQuote(value) {
  return `'${String(value).replaceAll("'", String.raw`'\''`)}'`;
}

// The same filesystem location, whatever each answer spelled it. Two checkouts of one repository can
// report their common directory through different symlinks (a `/var` → `/private/var` temp root is the
// ordinary case), so the comparison resolves both first and falls back to the literal text when a path
// cannot be resolved at all.
function samePath(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const real = (value) => { try { return realpathSync(value); } catch { return path.resolve(value); } };
  return real(left) === real(right);
}

// Where a landing of `destination` would actually merge, and whether that place can be merged in.
// Read-only from end to end: it switches nothing, locks nothing, creates nothing and writes nothing.
//
// `mergeBegin` reaches its destination with `git switch`, and git refuses to check one branch out
// twice — so in the layout `/esq:worktree` itself creates, a source branch in a linked worktree beside
// its origin in the main checkout could not land at all, and the refusal arrived only after `/esq:land`
// had paid its verification (B-154). The answer is not to force the switch but to run the same engine
// in the checkout that already holds the destination, and to say so before anything is spent.
//
// Two verdicts are usable. `here` is every case that behaves exactly as it always has — the destination
// is checked out in this very tree, or in none at all (a branch nothing has out, an absent branch,
// a git that cannot answer), where `mergeBegin`'s own switch and its own `absent` refusal still decide.
// `worktree` is a registered linked worktree that holds the destination and passes every check below.
// Everything else is a refusal carrying the real path and one command that clears it, because a
// hand-off that repeats the location failure is not a hand-off.
//
// Nothing about another worktree is taken on the registry's word. The chosen directory is asked itself
// whether it is the same repository (one common git directory) and whether it is still on the intended
// destination, and it must be clean — those three re-asks are also what makes a garbled stanza, or a
// registration that has gone stale since the listing, refuse rather than get merged into.
export function landingSite(root, destination) {
  const site = { verdict: null, path: null, branch: destination ?? null, usable: false, reason: null, command: null };
  const refuse = (verdict, reason, where, command) => ({ ...site, verdict, path: where ?? null, usable: false, reason, command: command ?? null });

  if (typeof destination !== 'string' || !safeRef(destination)) {
    return { ...site, branch: null, verdict: 'unsafe', reason: 'the destination is not a usable git ref' };
  }
  const repository = gitOut(root, ['rev-parse', '--show-toplevel']);
  if (!repository) return { ...site, verdict: 'here', path: null, usable: true, reason: 'git cannot report a working tree here, so nothing resolves a landing site' };

  const owner = worktreeRecords(repository).find((record) => record.branch === destination);
  if (!owner || samePath(owner.path, repository)) {
    return {
      ...site, verdict: 'here', path: repository, usable: true,
      reason: owner ? `${destination} is checked out here` : `no worktree has ${destination} checked out, so it is merged in place`,
    };
  }

  // A registration git itself marks unusable. Both are reported before the directory is touched: a
  // prunable worktree's path may not exist, and a locked one is locked precisely so nobody writes there.
  if (owner.locked) {
    return refuse('locked', `${destination} is checked out in ${owner.path}, and that worktree is locked`, owner.path,
      `git -C ${shellQuote(repository)} worktree unlock ${shellQuote(owner.path)}`);
  }
  if (owner.prunable) {
    return refuse('gone', `${destination} is registered to ${owner.path}, which git reports as prunable — the worktree is no longer there`, owner.path,
      `git -C ${shellQuote(repository)} worktree prune`);
  }

  const listing = `git -C ${shellQuote(repository)} worktree list`;
  const ourCommon = gitOut(repository, ['rev-parse', '--git-common-dir']);
  const theirCommon = gitOut(owner.path, ['rev-parse', '--git-common-dir']);
  if (!ourCommon || !theirCommon || !samePath(path.resolve(repository, ourCommon), path.resolve(owner.path, theirCommon))) {
    return refuse('foreign', `${owner.path} does not answer as the same repository as ${repository}, so it is not a landing site for ${destination}`, owner.path, listing);
  }
  const on = gitOut(owner.path, ['branch', '--show-current']);
  if (on !== destination) {
    return refuse('moved', `${owner.path} is registered as holding ${destination} but reports ${on || 'a detached HEAD'}`, owner.path, listing);
  }
  const status = gitOut(owner.path, ['status', '--porcelain']);
  if (status === null) return refuse('foreign', `git could not report the working tree state of ${owner.path}`, owner.path, listing);
  if (status !== '') {
    return refuse('dirty', `${destination} is checked out in ${owner.path}, and that working tree is not clean — commit or stash there first`, owner.path,
      `git -C ${shellQuote(owner.path)} status`);
  }

  return {
    ...site, verdict: 'worktree', path: owner.path, usable: true,
    reason: `${destination} is checked out in ${owner.path}, which is where the merge runs`,
  };
}

function mergeInProgress(repository) {
  return gitOut(repository, ['rev-parse', '--verify', '--quiet', 'MERGE_HEAD']);
}

function conflictedFiles(repository) {
  const raw = gitOut(repository, ['diff', '--name-only', '--diff-filter=U']) ?? '';
  const files = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  return {
    ledger: files.filter((file) => LEDGERS.includes(file)),
    other: files.filter((file) => !LEDGERS.includes(file)),
  };
}

// The two ladders, and the whole of what this file is allowed to decide on its own. They are an
// *ordering* over a closed vocabulary `cli.mjs` already holds (`STATUSES`, `ROW_STATUSES`), which is
// structure rather than judgment (D-cli-owns-structure-model-owns-judgment) — but only an ordering:
// a value that is not on a ladder has no position here, and inventing one would be fiction. `Dropped`
// is deliberately off the status ladder; it is a judgment about an item, not progress through its
// lifecycle. `Pri` orders by level first and confirmation second, so `hi?` outranks `med` and `hi`
// outranks `hi?`.
const STATUS_LADDER = ['Open', 'Needs-decision', 'Planned', 'Done'];
const STATUS_OFF_LADDER = ['Dropped'];
const PRI_LADDER = ['lo?', 'lo', 'med?', 'med', 'hi?', 'hi'];

// Three-way reconciliation of one cell. Pure: no git, no file, no state — the same three strings
// always give the same verdict, which is what lets the attended and unattended paths reconcile
// identically and differ only in who answers an `ask`.
//
// Returns `{value, rule}` when a rule settled it, or `{ask}` naming why it could not. `base` is
// `null` for a row that did not exist at the fork point; that only removes the one-side-unchanged
// rule, it never invents an answer.
export function derive(ours, theirs, base, column = null) {
  const ourValue = typeof ours === 'string' ? ours.trim() : '';
  const theirValue = typeof theirs === 'string' ? theirs.trim() : '';
  const baseValue = typeof base === 'string' ? base.trim() : null;

  if (ourValue === theirValue) return { value: ourValue, rule: 'both-sides-equal' };
  if (baseValue !== null && ourValue === baseValue) return { value: theirValue, rule: 'one-side-unchanged' };
  if (baseValue !== null && theirValue === baseValue) return { value: ourValue, rule: 'one-side-unchanged' };
  if (ourValue === '') return { value: theirValue, rule: 'blank-loses-to-non-blank' };
  if (theirValue === '') return { value: ourValue, rule: 'blank-loses-to-non-blank' };

  // A rank encodes a chosen position. Different numbers alone cannot prove that two edits meant
  // the same order; keeping ours used to discard the incoming intention silently.
  if (column === RANK_COLUMN) return { ask: 'both sides changed Rank — resolve the intended order' };

  for (const [name, ladder, offLadder] of [['status', STATUS_LADDER, STATUS_OFF_LADDER], ['pri', PRI_LADDER, []]]) {
    const ourRank = ladder.indexOf(ourValue);
    const theirRank = ladder.indexOf(theirValue);
    if (ourRank !== -1 && theirRank !== -1) {
      return { value: ourRank > theirRank ? ourValue : theirValue, rule: `${name}-ladder` };
    }
    if (ourRank === -1 && theirRank === -1) continue;
    const stray = ourRank === -1 ? ourValue : theirValue;
    return offLadder.includes(stray)
      ? { ask: `${stray} is a judgment, not a position on the ${name} ladder` }
      : { ask: `${stray} is not on the ${name} ladder — its position is not this command's to invent` };
  }

  return { ask: 'two different non-blank values with no documented ordering' };
}

// A ledger table as the file actually writes it: the header row's own labels, and the rows keyed by
// the ID in the first column. Cells are keyed by header *name*, never by position — this repo's own
// backlog has 8 columns where the canonical schema has 9, so the same index is not the same field in
// every ledger.
const LEDGER_ID = /^(B-\d+|D-[A-Za-z0-9-]+)$/;

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function parseLedgerTable(text) {
  if (typeof text !== 'string') return null;
  const lines = text.split('\n').filter((line) => /^\s*\|/.test(line));
  if (lines.length === 0) return null;
  const columns = splitRow(lines[0]);
  const rows = new Map();
  for (const line of lines.slice(1)) {
    const cells = splitRow(line);
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
    if (!LEDGER_ID.test(cells[0])) continue;
    if (rows.has(cells[0])) continue;
    rows.set(cells[0], Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? ''])));
  }
  return { columns, rows };
}

// Every shared row, cell by cell, with `derive`'s verdict already applied. The three sides come from
// the merge's own refs rather than from the conflict markers in the working tree — `HEAD` is the
// destination (nothing is committed while the merge is held), `MERGE_HEAD` is the incoming branch,
// and the merge base is the fork point. That is one code path for both cases the callers meet: a
// ledger git raised a conflict on, and one that auto-merged cleanly with both copies of a row in it.
//
// Only rows present on *both* sides and differing in at least one cell are reported. A row on one
// side only has nothing to reconcile, and the ID column is the key — reconciliation changes cells,
// never keys.
function ledgerCellVerdicts(repository, file, mergeBase) {
  const ours = parseLedgerTable(gitOut(repository, ['show', `HEAD:${file}`]));
  const theirs = parseLedgerTable(gitOut(repository, ['show', `MERGE_HEAD:${file}`]));
  if (!ours || !theirs) return [];
  const base = mergeBase ? parseLedgerTable(gitOut(repository, ['show', `${mergeBase}:${file}`])) : null;
  const key = ours.columns[0];
  const columns = [...new Set([...ours.columns, ...theirs.columns])].filter((column) => column !== key);

  const reported = [];
  for (const [id, ourRow] of ours.rows) {
    const theirRow = theirs.rows.get(id);
    if (!theirRow) continue;
    const baseRow = base?.rows.get(id) ?? null;
    const cells = [];
    for (const column of columns) {
      const ourValue = ourRow[column] ?? '';
      const theirValue = theirRow[column] ?? '';
      if (ourValue.trim() === theirValue.trim()) continue;
      const baseValue = baseRow ? (baseRow[column] ?? '') : null;
      const verdict = derive(ourValue, theirValue, baseValue, column);
      cells.push({
        column,
        ours: ourValue,
        theirs: theirValue,
        base: baseValue,
        verdict: verdict.ask === undefined ? 'derived' : 'ask',
        ...verdict,
      });
    }
    if (cells.length > 0) reported.push({ file, id, cells });
  }
  return reported;
}

// Every ledger both sides carry, reconciled cell-wise. The caller never re-parses a conflict marker.
function ledgerRows(repository, mergeBase) {
  return LEDGERS.flatMap((file) => ledgerCellVerdicts(repository, file, mergeBase));
}

// Hold a merge open. Every precondition is checked against refs *before* HEAD moves, so a refusal
// never leaves the caller on a branch it did not start on: the switch is the last thing that happens
// before `git merge`, and a merge that fails to start switches back.
export function mergeBegin(root, branch, into) {
  const shape = { verdict: null, branch: branch ?? null, destination: into ?? null, switched: false, mergeBase: null, conflicts: { ledger: [], other: [], rows: [] }, clean: false, refuse: false, reason: null };
  const refuse = (reason, verdict = 'refused', extra = {}) => ({ ...shape, ...extra, verdict, refuse: true, reason });

  const repository = gitOut(root, ['rev-parse', '--show-toplevel']);
  if (!repository) return refuse('not inside a git working tree');
  if (!safeRef(branch)) return refuse('the branch to merge is not a usable git ref');
  if (into !== undefined && into !== null && !safeRef(into)) return refuse('the destination is not a usable git ref');
  if (mergeInProgress(repository)) return refuse('a merge is already in progress — seal it or abort it first', 'merge-in-progress');
  const status = gitOut(repository, ['status', '--porcelain']);
  if (status === null) return refuse('git could not report the working tree state');
  if (status !== '') return refuse('the working tree is not clean — commit or stash first', 'dirty');
  if (!gitOut(repository, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`])) return refuse(`branch ${branch} does not exist`, 'absent');

  const current = gitOut(repository, ['branch', '--show-current']) || null;
  if (!current && (into === undefined || into === null)) return refuse('HEAD is detached and no destination was given');
  const destination = into ?? current;
  if (destination === branch) return refuse(`${branch} cannot be merged into itself — run this from the destination branch`, 'self');
  if (!gitOut(repository, ['rev-parse', '--verify', '--quiet', `refs/heads/${destination}`])) return refuse(`destination branch ${destination} does not exist`, 'absent', { destination });
  // Ancestry is read off the refs, so the no-op answer costs no checkout and cannot strand HEAD.
  if (gitRun(repository, ['merge-base', '--is-ancestor', `refs/heads/${branch}`, `refs/heads/${destination}`]).status === 0) {
    return refuse(`${branch} is already an ancestor of ${destination} — nothing to merge`, 'up-to-date', { destination });
  }

  let switched = false;
  if (destination !== current) {
    const switching = gitRun(repository, ['switch', '--', destination]);
    if (switching.status !== 0) return refuse(switching.stderr || `could not switch to ${destination}`, 'refused', { destination });
    switched = true;
  }

  const merging = gitRun(repository, ['merge', '--no-ff', '--no-commit', `refs/heads/${branch}`]);
  if (!mergeInProgress(repository)) {
    // git declined to start one at all — an unrelated history, a would-be-overwritten file. Put HEAD
    // back where it was found; there is no merge state to abort.
    if (switched && current) gitRun(repository, ['switch', '--', current]);
    return refuse(merging.stderr || merging.stdout || 'git refused to start the merge', 'refused', { destination });
  }

  const conflicts = conflictedFiles(repository);
  const conflicted = conflicts.ledger.length + conflicts.other.length;
  const mergeBase = gitOut(repository, ['merge-base', 'HEAD', 'MERGE_HEAD']);
  return {
    ...shape,
    verdict: 'held',
    destination,
    switched,
    mergeBase,
    conflicts: { ...conflicts, rows: ledgerRows(repository, mergeBase) },
    clean: conflicted === 0,
    refuse: false,
    reason: conflicted === 0
      ? `${branch} merged into ${destination} without conflict, held uncommitted`
      : `${branch} merged into ${destination} with ${conflicted} conflicted file(s), held uncommitted`,
  };
}

// The four duplicate-ID predicates, in-process over file text. The skill printed them as
// `grep | sort | uniq -d` pipelines; nothing taken from a ledger's content is ever executed, so they
// are regexes over a string here rather than a shell line built around an ID. The trailing boundary
// is what stops `B-002` matching `B-0021` and `D-auth` matching `D-auth-rotation`.
const DUPLICATE_PREDICATES = [
  { file: 'docs/BACKLOG.md', kind: 'row', pattern: /^\| *(B-\d+)(?![A-Za-z0-9-])/gm },
  { file: 'docs/BACKLOG.md', kind: 'section', pattern: /^## *(B-\d+)(?![A-Za-z0-9-])/gm },
  { file: 'docs/DECISIONS.md', kind: 'row', pattern: /^\| *(D-[A-Za-z0-9-]+)/gm },
  { file: 'docs/DECISIONS.md', kind: 'section', pattern: /^## *(D-[A-Za-z0-9-]+)/gm },
];

// Present at the fork point or not — the whole discriminator between one item both sides edited and
// two items minted with one number. A ledger absent at the base has every one of its IDs absent.
function presentAtBase(text, id) {
  if (text === null) return false;
  return new RegExp(`^(\\| *|## *)${id.replace(/[^A-Za-z0-9-]/g, '')}([^A-Za-z0-9-]|$)`, 'm').test(text);
}

// A read-only scan of the merged working tree. It writes nothing, it never exits nonzero on what it
// finds — a duplicate is a report, and refusing on one is `seal`'s job — and it derives the merge
// base from `MERGE_HEAD` itself rather than trusting a value its caller carried.
export async function mergeScan(root) {
  const shape = { verdict: null, mergeBase: null, duplicates: [], rows: [], clean: false, refuse: false, reason: null };
  const repository = gitOut(root, ['rev-parse', '--show-toplevel']);
  if (!repository) return { ...shape, verdict: 'refused', refuse: true, reason: 'not inside a git working tree' };
  if (!mergeInProgress(repository)) {
    return { ...shape, verdict: 'no-merge', refuse: true, reason: 'no merge in progress — `esq merge begin` holds one open for this to read' };
  }
  const mergeBase = gitOut(repository, ['merge-base', 'HEAD', 'MERGE_HEAD']);

  const baseText = new Map();
  const workText = new Map();
  const duplicates = [];
  for (const { file, kind, pattern } of DUPLICATE_PREDICATES) {
    if (!workText.has(file)) {
      let text = null;
      try { text = await readText(path.join(repository, file)); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      workText.set(file, text);
    }
    const text = workText.get(file);
    if (text === null) continue;

    const counts = new Map();
    for (const match of text.matchAll(pattern)) counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
    const repeated = [...counts].filter(([, count]) => count > 1);
    if (repeated.length === 0) continue;

    if (!baseText.has(file)) baseText.set(file, mergeBase ? gitOut(repository, ['show', `${mergeBase}:${file}`]) : null);
    for (const [id, count] of repeated) {
      duplicates.push({
        file,
        kind,
        id,
        count,
        classification: presentAtBase(baseText.get(file), id) ? 'present-at-base' : 'absent-at-base',
      });
    }
  }

  duplicates.sort((a, b) => a.file.localeCompare(b.file) || a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
  const collisions = duplicates.filter((duplicate) => duplicate.classification === 'absent-at-base');
  return {
    ...shape,
    verdict: 'scanned',
    mergeBase,
    duplicates,
    rows: ledgerRows(repository, mergeBase),
    clean: duplicates.length === 0,
    reason: duplicates.length === 0
      ? 'no duplicate IDs in the merged ledgers'
      : `${duplicates.length} duplicated ID(s), ${collisions.length} of them absent at the merge base`,
  };
}

// Git's conflict hunks, as segments, both styles. `|||||||` only appears under diff3; its absence is
// not an error, it is the default merge style.
function splitConflicts(text) {
  const lines = text.split('\n');
  const segments = [];
  let buffer = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^<{7} /.test(lines[index])) { buffer.push(lines[index]); continue; }
    segments.push({ type: 'text', lines: buffer });
    buffer = [];
    const raw = [lines[index]];
    const ours = [];
    const base = [];
    const theirs = [];
    let side = ours;
    let closed = false;
    for (index += 1; index < lines.length; index += 1) {
      raw.push(lines[index]);
      if (/^\|{7}/.test(lines[index])) { side = base; continue; }
      if (/^={7}$/.test(lines[index])) { side = theirs; continue; }
      if (/^>{7} /.test(lines[index])) { closed = true; break; }
      side.push(lines[index]);
    }
    segments.push({ type: 'conflict', ours, base, theirs, raw, closed });
  }
  segments.push({ type: 'text', lines: buffer });
  return segments;
}

// One conflict hunk, resolved — or `null`, meaning it is not this command's to resolve and its
// markers stay exactly where git wrote them for the caller to answer. `null` is the answer for
// anything that is not purely table rows (a conflicted detail section, a blank line, prose) and for
// any row carrying a cell `derive` asks about: a hunk is taken whole or not at all, so a row is never
// half-reconciled by a rule and half by a human.
function resolveRowHunk(segment, columns, baseRows) {
  const key = columns[0];
  const parse = (side) => {
    const rows = [];
    const seen = new Set();
    for (const line of side) {
      if (!/^\s*\|/.test(line)) return null;
      const cells = splitRow(line);
      if (!LEDGER_ID.test(cells[0]) || seen.has(cells[0])) return null;
      seen.add(cells[0]);
      rows.push({ id: cells[0], cells: Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? ''])) });
    }
    return rows;
  };

  const ourRows = parse(segment.ours);
  const theirRows = parse(segment.theirs);
  if (!ourRows || !theirRows || ourRows.length + theirRows.length === 0) return null;

  const theirById = new Map(theirRows.map((row) => [row.id, row]));
  const taken = new Set();
  const applied = [];
  const lines = [];
  for (const ourRow of ourRows) {
    const theirRow = theirById.get(ourRow.id);
    if (!theirRow) { lines.push(formatRow(columns.map((column) => ourRow.cells[column] ?? ''))); continue; }
    taken.add(ourRow.id);
    const baseRow = baseRows?.get(ourRow.id) ?? null;
    const merged = {};
    const cells = [];
    for (const column of columns) {
      const ourValue = ourRow.cells[column] ?? '';
      const theirValue = theirRow.cells[column] ?? '';
      if (column === key || ourValue.trim() === theirValue.trim()) { merged[column] = ourValue; continue; }
      const verdict = derive(ourValue, theirValue, baseRow ? (baseRow[column] ?? '') : null, column);
      if (verdict.ask !== undefined) return null;
      merged[column] = verdict.value;
      cells.push({ column, value: verdict.value, rule: verdict.rule });
    }
    if (cells.length > 0) applied.push({ id: ourRow.id, cells });
    lines.push(formatRow(columns.map((column) => merged[column] ?? '')));
  }
  for (const theirRow of theirRows) {
    if (!taken.has(theirRow.id)) lines.push(formatRow(columns.map((column) => theirRow.cells[column] ?? '')));
  }
  return { lines, applied };
}

// Write every conflicted ledger row the rules settle, and nothing else. This is what makes the
// attended and unattended paths reconcile *identically*: the derivable half is applied here, in one
// implementation, and what survives is exactly the set of questions a human has to answer — an `ask`
// cell, a conflicted detail section, a non-ledger file. Those keep their markers, and `seal` then
// refuses on them rather than committing git's unresolved text.
async function applyDerivedRows(repository, mergeBase) {
  const applied = [];
  for (const file of conflictedFiles(repository).ledger) {
    const absolute = path.join(repository, file);
    let text;
    try { text = await readText(absolute); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }

    // The column list comes from the *merged* working tree, never from `HEAD:<file>`. A column added
    // on the incoming branch only merges cleanly — nothing on the destination touched the header line
    // — so the destination's copy is one column short of the very table these rows are written back
    // into, and every reconciled row would be rendered a cell shy of its own header, silently losing
    // the new column's values (B-105). Conflict markers are not `|` lines, so the merged text parses
    // to the merged header; `HEAD:<file>` stays the fallback for a working tree that will not parse.
    const ours = parseLedgerTable(text) ?? parseLedgerTable(gitOut(repository, ['show', `HEAD:${file}`]));
    if (!ours) continue;
    const base = mergeBase ? parseLedgerTable(gitOut(repository, ['show', `${mergeBase}:${file}`])) : null;

    const segments = splitConflicts(text);
    let changed = false;
    const out = [];
    for (const segment of segments) {
      if (segment.type === 'text') { out.push(...segment.lines); continue; }
      const resolved = segment.closed ? resolveRowHunk(segment, ours.columns, base?.rows) : null;
      if (!resolved) { out.push(...segment.raw); continue; }
      out.push(...resolved.lines);
      for (const row of resolved.applied) applied.push({ file, ...row });
      changed = true;
    }
    if (changed) await atomicWrite(absolute, out.join('\n'));
  }
  return applied;
}

// Which branch this held merge is merging. `MERGE_HEAD` is a commit, and the report has to name the
// branch a human asked for: a ref pointing at it answers unambiguously, `MERGE_MSG` answers when
// several do, and the short hash is the honest last resort rather than a guess.
async function mergedBranchName(repository) {
  const pointing = (gitOut(repository, ['for-each-ref', '--format=%(refname:short)', '--points-at', 'MERGE_HEAD', 'refs/heads/']) ?? '')
    .split('\n').map((line) => line.trim()).filter(Boolean);
  if (pointing.length === 1) return pointing[0];
  const messagePath = gitOut(repository, ['rev-parse', '--git-path', 'MERGE_MSG']);
  if (messagePath) {
    try {
      const named = (await readText(path.resolve(repository, messagePath))).match(/^Merge branch '([^']+)'/m);
      if (named && pointing.includes(named[1])) return named[1];
      if (named && pointing.length === 0) return named[1];
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return pointing[0] ?? gitOut(repository, ['rev-parse', '--short', 'MERGE_HEAD']);
}

// Git's own markers, as git writes them: seven characters and a label. `=======` is deliberately not
// among them — it is also a legitimate setext underline, and a guard that reds on ordinary prose is
// a guard people learn to bypass.
const CONFLICT_MARKER = /^(<{7} |>{7} )/m;

// Equal numbers on different rows are not an ordering decision. Keep the stored sequence, break
// cross-branch ties destination-first, and renumber only when needed. Before writing, prove that
// this preserves each side's additions/ordering edits relative to the base. An incompatible
// placement is a question, never a priority/ID sort or an invitation to silently append it.
async function reconcileMergeRanks(repository, mergeBase) {
  const file = 'docs/BACKLOG.md';
  const absolute = path.join(repository, file);
  let text;
  try { text = await readText(absolute); }
  catch (error) { if (error.code === 'ENOENT') return { applied: [] }; throw error; }
  const table = parseLedgerTable(text);
  if (!table?.columns.includes(RANK_COLUMN)) return { applied: [] };
  const ranked = (ledger) => [...(ledger?.rows.values() ?? [])]
    .filter((row) => /^\d+$/.test(row.Rank ?? ''));
  const rows = ranked(table);
  if (new Set(rows.map((row) => Number(row.Rank))).size === rows.length) return { applied: [] };
  if ([...table.rows.values()].some((row) => row.Rank
    && (!/^\d+$/.test(row.Rank) || !Number.isSafeInteger(Number(row.Rank))))) {
    return { ask: 'invalid Rank in the merged backlog — resolve it before reconciling collisions' };
  }

  const ours = parseLedgerTable(gitOut(repository, ['show', `HEAD:${file}`]));
  const theirs = parseLedgerTable(gitOut(repository, ['show', `MERGE_HEAD:${file}`]));
  const base = mergeBase ? parseLedgerTable(gitOut(repository, ['show', `${mergeBase}:${file}`])) : null;
  const key = table.columns[0];
  rows.sort((a, b) => Number(a.Rank) - Number(b.Rank)
    || Number(ours?.rows.has(b[key]) ?? false) - Number(ours?.rows.has(a[key]) ?? false));
  const positions = new Map(rows.map((row, index) => [row[key], index]));
  for (const side of [ours, theirs]) {
    const sequence = ranked(side).filter((row) => positions.has(row[key]))
      .sort((a, b) => Number(a.Rank) - Number(b.Rank));
    if (new Set(sequence.map((row) => Number(row.Rank))).size !== sequence.length) {
      return { ask: 'duplicate Rank already exists on a merge side — resolve its order first' };
    }
    for (let i = 0; i < sequence.length; i += 1) {
      for (let j = i + 1; j < sequence.length; j += 1) {
        const before = sequence[i][key];
        const after = sequence[j][key];
        if (positions.get(before) < positions.get(after)) continue;
        const baseBefore = base?.rows.get(before)?.Rank;
        const baseAfter = base?.rows.get(after)?.Rank;
        // An unchanged relation may yield to the other side's deliberate move. A new or changed
        // relation may not: numbers from separate branches are insufficient authority to lose it.
        if (/^\d+$/.test(baseBefore ?? '') && /^\d+$/.test(baseAfter ?? '')
          && Number(baseBefore) < Number(baseAfter)) continue;
        return { ask: `Rank reconciliation would reverse ${before} before ${after} — resolve the intended order` };
      }
    }
  }
  const ranks = new Map(rows.map((row, index) => [row[key], (index + 1) * RANK_STEP]));
  const rankIndex = table.columns.indexOf(RANK_COLUMN);
  const lines = text.split('\n');
  const assignments = [];
  const applied = [];
  for (let line = 0; line < lines.length; line += 1) {
    if (!/^\s*\|/.test(lines[line])) continue;
    const row = splitRow(lines[line]);
    const rank = ranks.get(row[0]);
    if (rank === undefined || row[rankIndex] === String(rank)) continue;
    assignments.push({ entry: { row, rankIndex, line }, rank });
    applied.push({ file, id: row[0], cells: [{ column: RANK_COLUMN, value: String(rank), rule: 'rank-collision' }] });
  }
  await writeRanks(absolute, lines, assignments);
  return { applied };
}

// Commit the held merge. Derived rows may be written before a refusal, but nothing is staged or
// committed until every check passes; the merge stays held for the caller to resolve or abort.
//
// Two refusals are the point of the verb. A duplicate ID still classified `absent-at-base` is two
// items minted under one number, and sealing it would publish the collision; a surviving conflict
// marker is git's own unresolved text, and `git add -A` would commit it as content.
export async function mergeSeal(root) {
  const shape = { verdict: null, branch: null, destination: null, applied: [], commit: null, refuse: false, reason: null };
  const refuse = (reason, verdict = 'refused', extra = {}) => ({ ...shape, ...extra, verdict, refuse: true, reason });

  const repository = gitOut(root, ['rev-parse', '--show-toplevel']);
  if (!repository) return refuse('not inside a git working tree');
  if (!mergeInProgress(repository)) {
    return refuse('no merge in progress — `esq merge begin` holds one open for this to seal', 'no-merge');
  }
  const destination = gitOut(repository, ['branch', '--show-current']) || null;
  if (!destination) return refuse('HEAD is detached — a merge is sealed onto the destination branch it began from');
  const branch = await mergedBranchName(repository);
  const named = { branch, destination };

  // The collision refusal runs before the first write, so it is a total no-op: an ID minted on both
  // sides is answered on the branches, not here, and nothing about the merged tree changes on the way
  // to saying so. Markers do not hide it — both sides' rows are in the file either way.
  const scanned = await mergeScan(repository);
  const collisions = scanned.duplicates.filter((duplicate) => duplicate.classification === 'absent-at-base');
  if (collisions.length > 0) {
    const ids = [...new Set(collisions.map((collision) => collision.id))];
    return refuse(`${ids.join(', ')} ${ids.length === 1 ? 'was' : 'were'} minted on both sides and absent at the merge base — two items under one ID; no ID is ever reassigned to make that go away`, 'collision', { ...named, collisions });
  }

  // Every cell the rules settle is written first, in one place, so the attended and unattended paths
  // reconcile identically and differ only in who answers an `ask`.
  const applied = await applyDerivedRows(repository, gitOut(repository, ['merge-base', 'HEAD', 'MERGE_HEAD']));
  const carrying = { ...named, applied };

  // The arbiter is the working tree's text, not the index. A caller resolves a conflict by editing
  // the file; `git add` is this verb's own first write, so an unmerged index entry is the normal
  // state on the way in and refusing on it would refuse every legitimate seal. What must never be
  // committed is git's unresolved text, and that is visible in the file itself.
  const lines = (raw) => (raw ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
  const touched = [...new Set([
    ...lines(gitOut(repository, ['diff', '--name-only', '--diff-filter=U'])),
    ...lines(gitOut(repository, ['diff', '--name-only', 'HEAD'])),
  ])];
  const marked = [];
  for (const file of touched) {
    let text;
    try { text = await readText(path.join(repository, file)); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (CONFLICT_MARKER.test(text)) marked.push(file);
  }
  if (marked.length > 0) {
    return refuse(`conflict markers survive in ${marked.join(', ')} — resolve them or run \`esq merge abort\``, 'markers', carrying);
  }

  const ranks = await reconcileMergeRanks(repository, scanned.mergeBase);
  if (ranks.ask) return refuse(ranks.ask, 'ask', carrying);
  applied.push(...ranks.applied);

  const adding = gitRun(repository, ['add', '-A']);
  if (adding.status !== 0) return refuse(adding.stderr || 'git could not stage the merge result', 'refused', carrying);
  const committing = gitRun(repository, ['commit', '-q', '-m', `merge: ${branch} into ${destination}`]);
  if (committing.status !== 0) {
    return refuse(committing.stderr || committing.stdout || 'git could not commit the merge', 'refused', carrying);
  }

  const commit = gitOut(repository, ['rev-parse', '--short', 'HEAD']);
  return { ...shape, ...carrying, verdict: 'sealed', commit, reason: `${branch} merged into ${destination} as ${commit}` };
}

// Undo everything `begin` did. `git merge --abort` restores the pre-merge working tree and index,
// including the conflict resolutions a caller had already written, which is exactly what makes a
// refusal cheap: the escape costs one command and leaves the source branch and every commit on it
// untouched.
export function mergeAbort(root) {
  const shape = { verdict: null, refuse: false, reason: null };
  const repository = gitOut(root, ['rev-parse', '--show-toplevel']);
  if (!repository) return { ...shape, verdict: 'refused', refuse: true, reason: 'not inside a git working tree' };
  if (!mergeInProgress(repository)) {
    return { ...shape, verdict: 'no-merge', refuse: true, reason: 'no merge in progress — there is nothing to abort' };
  }
  const aborting = gitRun(repository, ['merge', '--abort']);
  if (aborting.status !== 0) {
    return { ...shape, verdict: 'refused', refuse: true, reason: aborting.stderr || 'git could not abort the merge' };
  }
  return { ...shape, verdict: 'aborted', reason: 'the merge was aborted; the working tree is as it was before it began' };
}
// The line a human runs when the landing did not happen. Every refusal below carries one: a user
// whose runs never land has to be able to finish by hand from the line they were given, and the
// plan's own risk note makes a bare reason with no next step a defect rather than a detail.
//
// The line alone is not always enough. `/esq:worktree merge` merges into the branch the session it
// runs in has checked out, so handed to a user standing in the source worktree it reproduces the very
// location failure it was offered for (B-154). That is what `cwd` is: the directory the command must
// be run in, carried beside it rather than folded into it, so a caller relays a runnable command and a
// place — and `null` whenever the caller's own checkout is that place.
function handOff(branch, destination) {
  if (!safeRef(branch)) return null;
  return `/esq:worktree merge ${branch}${destination ? ` into ${destination}` : ''}`;
}

// The unattended composition, and the only landing in esquisse with no human in the loop. It merges
// nothing of its own: it is `begin` → `scan` → `seal`, the same three verbs `/esq:worktree merge`
// drives, with the derive rules answering every question instead of the user. The difference between
// the attended path and this one is exactly who answers an `ask` — and `land` answers none. It aborts
// on the first one, which makes it a strict subset of the attended path by construction rather than
// by discipline.
//
// Two rules hold the autonomy. **The authority is read here**, in this process, immediately before
// `begin` makes the first git write: the plan file's own `**Branch:**` and `**Origin:**` header
// fields, never a source and destination carried in from a caller — so a landing always goes to the
// branch the shipping unit was started from, and there is no window between the authority read and
// the merge. **And every refusal is a no-op:** after any exit from this function but the landing
// itself, the merge is aborted, HEAD is back on the branch this was called from, and the source
// branch and every commit on it are untouched.
export async function mergeLand(root, planPath) {
  const shape = {
    verdict: null, landed: false, plan: planPath ?? null, branch: null, destination: null,
    site: null, cwd: null,
    mergeBase: null, conflicts: [], asks: [], collisions: [], applied: [], commit: null,
    refuse: false, reason: null, command: null,
  };
  const repository = gitOut(root, ['rev-parse', '--show-toplevel']);
  if (!repository) return { ...shape, verdict: 'refused', refuse: true, reason: 'not inside a git working tree' };

  // Every refusal is shaped the same: it did not land, this is why, and this is the command that
  // would. The hand-off names whatever the plan established before the refusal, so it is runnable
  // when the two refs are known and absent when they are not — a header field that fails `safeRef`
  // is never echoed back, repaired or guessed at. A caller may supply its own `command` — the
  // destination refusal does, because the line that clears a dirty or locked worktree is a git line
  // about that directory and not a merge to retry.
  const refuse = (verdict, reason, extra = {}) => {
    const merged = { ...shape, ...extra, verdict, refuse: true, landed: false, reason };
    return { ...merged, command: merged.command ?? handOff(merged.branch, merged.destination) };
  };

  // The authority read, immediately before the first git write. The plan header is model-written
  // text that may arrive on a branch someone else wrote, so both fields pass `safeRef` before either
  // reaches git, and a field that does not validate is named — never its value, which on a hostile
  // branch is attacker-supplied text reaching a terminal and a log.
  if (!planPath) return refuse('plan', 'no plan file was given — `esq merge land --plan <plan-path>` takes both refs from the plan header');
  let header;
  try { header = await readText(path.resolve(root, planPath)); }
  catch { return refuse('plan', `the plan file could not be read: ${planPath}`); }

  const branch = parseBranch(header);
  const origin = parseOrigin(header);
  if (!branch) return refuse('plan', 'the plan records no **Branch:** — there is no branch to land');
  if (!origin) return refuse('legacy', 'the plan records no **Origin:** — it is a legacy plan, and a legacy plan never lands', { branch: safeRef(branch) ? branch : null });
  if (!safeRef(branch)) return refuse('unsafe', "the plan's **Branch:** field is not a usable git ref");
  if (!safeRef(origin)) return refuse('unsafe', "the plan's **Origin:** field is not a usable git ref", { branch });

  // Where this merge can actually happen, resolved here and not carried in — the same rule the two
  // refs above obey, and for the same reason: this is the process that is about to write, and a site
  // resolved a minute ago in a preflight is a claim about a directory that has had a minute to change.
  // `mergeBegin` reaches its destination by `git switch`, and git refuses to check one branch out
  // twice, so a destination living in another worktree is merged *there* rather than forced to move
  // here — the three verbs are unchanged, only their root is (B-154).
  const site = landingSite(repository, origin);
  if (!site.usable) {
    return refuse('destination', site.reason, { branch, destination: origin, site, command: site.command });
  }
  // The verification a landing runs stays in the invoking checkout, against the source tree. Only the
  // merge moves; handing the source tree's own path anywhere below would verify the destination's
  // older code in place of the code being landed.
  const mergeRoot = site.path ?? repository;
  const startedOn = gitOut(mergeRoot, ['branch', '--show-current']) || null;
  // A command that has to be run somewhere else says where. Set once, here, so every refusal below
  // inherits it and none can print a bare line that repeats this run's own location failure.
  const cwd = site.verdict === 'worktree' ? site.path : null;

  const held = mergeBegin(mergeRoot, branch, origin);
  // `begin` checks every precondition against refs before HEAD moves, so its six refusal verdicts —
  // `dirty`, `absent`, `self`, `up-to-date`, `merge-in-progress`, `refused` — arrive here as no-ops
  // already. They keep their own verdict and reason; `land` only adds what did not happen and how a
  // human would make it happen. `up-to-date` is the one that is not a fault at all: a branch already
  // an ancestor of its destination has nothing to land, and saying so is the truthful answer to a
  // second `land` of the same branch.
  if (held.refuse) return refuse(held.verdict, held.reason, { branch, destination: held.destination ?? origin, site, cwd });

  const carrying = { branch, destination: held.destination, site, cwd, mergeBase: held.mergeBase };
  // Undo everything `begin` did, HEAD included. `git merge --abort` restores the tree and index; the
  // switch back is what makes the refusal a no-op for the caller rather than only for the repository.
  // It restores the branch of the tree the merge was *held in* — which is `mergeRoot`, not the caller's
  // checkout: reading `startedOn` from the invoking directory would put the wrong branch back, in the
  // wrong tree, on the path whose whole promise is that it changed nothing.
  const abort = (verdict, reason, extra = {}) => {
    mergeAbort(mergeRoot);
    if (held.switched && startedOn) gitRun(mergeRoot, ['switch', '--', startedOn]);
    return refuse(verdict, reason, { ...carrying, ...extra });
  };

  // A file outside the ledgers is never a rule's to settle — it has no schema, no ladder and no ID.
  // The attended path deliberately leaves these for the user and does *not* abort; aborting is this
  // verb's own rule, because there is nobody here to leave them for.
  if (held.conflicts.other.length > 0) {
    const files = held.conflicts.other;
    return abort('conflict', `${files.join(', ')} conflicted outside the ledgers — no rule reconciles a file with no schema`, { conflicts: files });
  }

  // The scan runs before the questions, because a collision *is* one: two items minted under one
  // number differ in every free-text cell, so reported as an `ask` it would reach the user as
  // "two different values with no documented ordering" and never mention that B-020 is now two items.
  // The ID fact is both cheaper to explain and the one that must not be answered by reconciling.
  // `seal` scans again before its own first write; this scan is what lets the refusal *abort* rather
  // than leave a held merge behind for nobody.
  const scanned = await mergeScan(mergeRoot);
  const collisions = scanned.duplicates.filter((duplicate) => duplicate.classification === 'absent-at-base');
  if (collisions.length > 0) {
    const ids = [...new Set(collisions.map((collision) => collision.id))];
    return abort('collision', `${ids.join(', ')} ${ids.length === 1 ? 'was' : 'were'} minted on both sides and absent at the merge base — two items under one ID; no ID is ever reassigned to make that go away`, { collisions });
  }

  // The first `ask` stops the landing. Two sessions editing one row's free text is ordinary, and the
  // attended path exists for exactly it.
  const asks = held.conflicts.rows.flatMap((row) => row.cells
    .filter((cell) => cell.verdict === 'ask')
    .map((cell) => ({ file: row.file, id: row.id, column: cell.column, ask: cell.ask })));
  if (asks.length > 0) {
    const [first] = asks;
    return abort('ask', `${first.file} ${first.id} — ${first.column}: ${first.ask}`, { asks });
  }

  // Only the derived half is ever written, and `seal` writes it — one implementation, shared with the
  // attended path. Anything it still refuses on (a conflicted detail section, a marker no rule reached)
  // aborts here rather than leaving the merge held.
  const sealed = await mergeSeal(mergeRoot);
  if (sealed.refuse) return abort(sealed.verdict, sealed.reason);

  // It landed, so there is nothing left to run and nowhere to run it: `cwd` names a place a *command*
  // must be run in, and a successful landing hands back no command. `site` stays, because where the
  // merge commit was made is a fact the report owes its reader.
  return {
    ...shape, ...carrying, cwd: null, verdict: 'landed', landed: true,
    applied: sealed.applied, commit: sealed.commit,
    reason: sealed.reason,
  };
}

// ── Routing a chosen `do:` ───────────────────────────────────────────────────
// A decision's chosen option carries a `do:` string, and the three orchestrators used to spawn one
// apply subagent on it whatever it said. Fourteen of the twenty-one skills carry
// `disable-model-invocation: true`, so the commonest `do:` of all — `/esq:backlog B-NNN done` — bought
// a subagent forbidden to invoke it while the authorized decision went unapplied (B-092). This verb
// answers, before the spend, which of three things the string is; and it reads the answer out of the
// named skill's own frontmatter rather than out of any list, because a list rots the first time a flag
// moves (D-executability-is-read-from-the-skill).
//
// It is structure, not judgment: a token shape, a frontmatter flag, and a ledger cell against a value
// from `STATUSES`. Recognition is deliberately narrow, because the alternative is a shell parser
// guessing at prose — one `/esq:<skill>` token, at the start, no chaining — and everything it cannot
// place is `stop`. Only two paths reach `apply`: a string naming no esq command at all (a file, a line
// and a replacement, which any agent may make) and a skill whose own frontmatter says a model may
// invoke it. Every other outcome fails closed by construction.
const SKILLS_DIR = fileURLToPath(new URL('../skills/', import.meta.url));
const ESQ_COMMAND = /\/esq:([A-Za-z0-9_-]*)/g;
const SKILL_NAME = /^[a-z][a-z0-9-]*$/;
// Anything that could make one string run more than one thing. A `do:` carrying any of it is `mixed`:
// what a subagent would run is then not provably what the user chose.
const CHAINING = /[;&|`\n\r]|\$\(/;
const DISABLE_FLAG = /^disable-model-invocation:[ \t]*(\S+)[ \t]*$/m;

function frontmatterBlock(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return null;
  const end = lines.indexOf('---', 1);
  return end < 0 ? null : lines.slice(1, end).join('\n');
}

// Who may invoke this skill, read from the skill itself. An absent skill, a file with no frontmatter
// and a flag value that is not a boolean all answer with a `reason` rather than a permission — the
// caller turns each of them into `stop`, never into `apply`.
async function skillInvocation(directory, name) {
  let text;
  try { text = await readText(path.join(directory, name, 'SKILL.md')); }
  catch { return { reason: `no skill named ${name} ships with this plugin, so nothing says who may invoke it` }; }
  const block = frontmatterBlock(text);
  if (block === null) return { reason: `${name}'s SKILL.md carries no frontmatter to read the invocation flag from` };
  const match = DISABLE_FLAG.exec(block);
  if (match === null) return { invocation: 'model' };
  if (match[1] === 'true') return { invocation: 'user' };
  if (match[1] === 'false') return { invocation: 'model' };
  return { reason: `${name} records disable-model-invocation: ${match[1]}, which is neither true nor false` };
}

const ROW_REFERENCE = /\bB-\d+\b/g;

// Every status the invocation's arguments name, matched against the closed vocabulary this file
// already owns — reading `STATUSES` is structure, the same ground `derive` stands on, and a token
// that is not on it is not a status. All of them, not the first: `--reason "still open" dropped`
// names two, and answering for whichever came first would compare the ledger against a word from a
// sentence.
function requestedStatuses(args) {
  const named = new Set();
  for (const token of args.split(/[\s,;|`'"=]+/)) {
    for (const status of STATUSES) {
      if (token.toLowerCase() === status.toLowerCase()) named.add(status);
    }
  }
  return [...named];
}

// The one observable this verb can compute: the invocation's own arguments name a ledger row and a
// status, and `docs/BACKLOG.md` says what that row reads now. Everything else answers `applied: null`
// with the reason named — an action nothing in the tree can settle is a stop for the caller, never an
// optimistic resume (D-a-relayed-decision-is-selected-until-state-confirms-it). `false` is reserved
// for a row that was read and disagrees; an unread ledger is never `false`.
async function ledgerObservation(root, args) {
  const references = [...new Set(args.match(ROW_REFERENCE) ?? [])];
  const statuses = requestedStatuses(args);
  if (references.length === 0 || statuses.length === 0) {
    return { confirm: null, applied: null, observedReason: 'no backlog row and status are named, so nothing in the tree settles whether it ran' };
  }
  // One row and one status, or nothing. An action naming two rows or two statuses has an effect this
  // reading covers only part of, and a partial effect reported as `applied: true` is exactly the
  // resume this verb exists to prevent — a red struck over work that did not happen.
  if (references.length > 1 || statuses.length > 1) {
    return {
      confirm: null,
      applied: null,
      observedReason: references.length > 1
        ? `names ${references.length} backlog rows (${references.join(', ')}), so one row's cell settles only part of it`
        : `names ${statuses.length} statuses (${statuses.join(', ')}), so which one it asks for is not settled`,
    };
  }
  const [expected] = statuses;
  const id = normalizeId(references[0]);
  let repository;
  try { repository = git(root, ['rev-parse', '--show-toplevel']); }
  catch { return { confirm: null, applied: null, observedReason: 'not inside a git working tree, so no ledger could be read' }; }
  const ledger = 'docs/BACKLOG.md';
  let read;
  try { read = await backlogTable(path.join(repository, ledger)); }
  catch (error) { return { confirm: null, applied: null, observedReason: `${ledger} could not be read: ${error.message}` }; }
  const row = read.table.rows.find((cells) => {
    try { return normalizeId(cells[read.idColumn]) === id; } catch { return false; }
  });
  if (row === undefined) {
    return { confirm: { ledger, id, expected, observed: null }, applied: null, observedReason: `${ledger} carries no row ${id}` };
  }
  const observed = row[read.statusColumn] ?? '';
  const applied = observed === expected;
  return {
    confirm: { ledger, id, expected, observed },
    applied,
    observedReason: applied ? `${id} reads ${observed}, so the action is applied` : `${id} still reads ${observed}, not ${expected}`,
  };
}

// Pure: the same string always classifies the same way, with no file and no process. Returns the
// settled verdict for every form but `invocation`, which needs the skill read.
function classifyDo(input) {
  // A brief wraps a `do:` in backticks, so a wrapping pair is unwrapped — but only when the interior
  // carries none of its own. `\`a\` becomes \`b\`` is a replacement whose backticks are content, and
  // stripping its last one silently changed what the option said.
  const raw = String(input).trim();
  const unwrapped = /^`+([^`]*)`+$/.exec(raw);
  const trimmed = (unwrapped === null ? raw : unwrapped[1]).trim();
  if (trimmed === '') return { form: 'unknown', route: 'stop', reason: 'the string is empty, so there is nothing to run' };
  const tokens = [...trimmed.matchAll(ESQ_COMMAND)];
  if (tokens.length === 0) {
    return { form: 'change', command: trimmed, route: 'apply', reason: 'names no esq command, so it is a change a subagent can make' };
  }
  if (tokens.length > 1) {
    return { form: 'mixed', route: 'stop', reason: `names ${tokens.length} esq commands, so one agent running it is not what was chosen` };
  }
  const [token] = tokens;
  if (token.index !== 0) {
    return { form: 'mixed', route: 'stop', reason: 'carries an esq command inside other text, so the action it names is not the whole string' };
  }
  if (CHAINING.test(trimmed)) {
    return { form: 'mixed', route: 'stop', reason: 'chains more than one command in one string' };
  }
  if (!SKILL_NAME.test(token[1])) {
    return { form: 'unknown', route: 'stop', reason: `${token[0]} does not name a skill` };
  }
  return { form: 'invocation', skill: token[1], command: trimmed, arguments: trimmed.slice(token[0].length).trim() };
}

export async function applyRoute(root, inputs, { skillsDir = SKILLS_DIR } = {}) {
  const routes = [];
  for (const input of inputs) {
    const blank = { do: String(input), form: null, skill: null, command: null, arguments: null, invocation: null, route: null, confirm: null, applied: null, reason: null };
    const shape = classifyDo(input);
    if (shape.form !== 'invocation') { routes.push({ ...blank, ...shape }); continue; }
    const read = await skillInvocation(skillsDir, shape.skill);
    if (read.invocation === undefined) { routes.push({ ...blank, ...shape, route: 'stop', reason: read.reason }); continue; }
    if (read.invocation === 'model') {
      routes.push({ ...blank, ...shape, invocation: 'model', route: 'apply', reason: `${shape.skill} does not disable model invocation, so a subagent may run it` });
      continue;
    }
    const { observedReason, ...observation } = await ledgerObservation(root, shape.arguments);
    routes.push({
      ...blank, ...shape, ...observation, invocation: 'user', route: 'relay',
      reason: `${shape.skill} carries disable-model-invocation: true, so only the user may invoke it — ${observedReason}`,
    });
  }
  return { routes };
}

export async function validate(root) {
  const findings = [];
  let repository;
  try { repository = git(root, ['rev-parse', '--show-toplevel']); }
  catch { return { valid: false, findings: ['not inside a git working tree'] }; }
  try {
    const { table, idColumn, statusColumn } = await backlogTable(path.join(repository, 'docs/BACKLOG.md'));
    const ids = new Set();
    // Both rank findings are gated, and on two different signals, because the column and the
    // adoption are not the same event. The column arrives on the *first write* into any backlog —
    // a row filed by build, check or review widens it — which says nothing about whether anyone has
    // ranked the project yet. So a duplicate rank is checked wherever the column exists (a table
    // with no numbers in it cannot hold one anyway), while "every open row carries a priority" is
    // checked only once at least one rank has actually been assigned. Otherwise the widening write
    // itself would red every unranked open row the project already had — which is precisely the
    // state every esquisse backlog is in between this column shipping and its first
    // `/esq:roadmap plan`, and validate blocks the session stop.
    const rankColumn = table.header.indexOf(RANK_COLUMN);
    const priColumn = ['Pri', 'Priority'].map((name) => table.header.indexOf(name)).find((index) => index >= 0) ?? -1;
    const ranks = new Map();
    const unprioritized = [];
    for (const row of table.rows) {
      const id = row[idColumn];
      if (!/^B-\d{3,}$/.test(id)) findings.push(`invalid backlog ID: ${id}`);
      if (ids.has(id)) findings.push(`duplicate backlog ID: ${id}`);
      ids.add(id);
      if (!STATUSES.has(row[statusColumn])) findings.push(`invalid backlog status for ${id}: ${row[statusColumn]}`);
      if (rankColumn < 0) continue;
      const rank = (row[rankColumn] ?? '').trim();
      if (rank !== '') {
        const owner = ranks.get(rank);
        if (owner !== undefined) findings.push(`duplicate backlog rank ${rank}: ${owner} and ${id}`);
        else ranks.set(rank, id);
      }
      if (ROW_STATUSES.has(row[statusColumn]) && (priColumn < 0 || (row[priColumn] ?? '').trim() === '')) {
        unprioritized.push(id);
      }
    }
    if (ranks.size > 0) for (const id of unprioritized) findings.push(`open backlog row with no priority: ${id}`);
  } catch (error) {
    if (error.code !== 'ENOENT') findings.push(error.message);
  }
  try {
    const decisions = await readText(path.join(repository, 'docs/DECISIONS.md'));
    const tableIds = [...decisions.matchAll(/^\| (D-[^ |]+) \|/gm)].map((match) => match[1]);
    const headingIds = [...decisions.matchAll(/^## (D-[^ ]+) —/gm)].map((match) => match[1]);
    for (const [label, ids] of [['decision table', tableIds], ['decision details', headingIds]]) {
      const seen = new Set();
      for (const id of ids) {
        if (seen.has(id)) findings.push(`duplicate ${label} ID: ${id}`);
        seen.add(id);
      }
    }
    for (const id of tableIds) {
      if (!headingIds.includes(id)) findings.push(`decision ${id} has no detail section`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') findings.push(error.message);
  }
  // Structure only, and `readVersion: false` so this spawns nothing: validate runs on every session
  // stop, and evidence being stale is a fact about the machine rather than a defect in the tree. A
  // registry that will not parse, or a row that points somewhere it may not, is the tree's problem.
  for (const file of await planFiles(repository)) {
    const relative = path.relative(repository, file);
    try {
      const text = await readText(file);
      const plan = parsePlan(text);
      if (plan.phases.length === 0) continue;
      nextPhase(plan);
    }
    catch (error) { findings.push(`${relative}: ${error.message}`); }
  }
  return { valid: findings.length === 0, root: repository, findings };
}

// The default standards referent ships inside the plugin, beside the skills, so `esq standards`
// answers from the installed CLI wherever it is invoked from. A project's own
// `docs/STANDARDS.md` is returned beside it and wins where it speaks;
// *which* clauses it speaks to is judgment, and judgment is never the CLI's, so this resolves paths
// and text and merges nothing.
const DEFAULT_STANDARDS = fileURLToPath(new URL('../standards/STANDARDS.md', import.meta.url));

// Read-only. Both files at most, both optional in different ways: a project with no `docs/STANDARDS.md`
// is the common case and never a finding, an empty or unreadable one is a note beside a referent that
// still resolves, and only a run where *neither* file yields text throws — a caller that gets an
// answer always has a standard to arbitrate against.
export async function standards(root, options = {}) {
  const defaultPath = options.defaultPath ?? DEFAULT_STANDARDS;
  // `docs/STANDARDS.md` is repository-relative, never cwd-relative: a run invoked from a subdirectory
  // that resolved it against `process.cwd()` lost the project's file silently — `present: false`,
  // `findings: []`, exit 0 — and arbitrated against the permissive plugin default. Resolve the top
  // first, as every other verb in this file does; outside a repository `root` stands as it always did.
  const repository = gitTry(root, ['rev-parse', '--show-toplevel']) ?? root;
  const projectPath = path.join(repository, 'docs/STANDARDS.md');
  const findings = [];
  const project = { path: 'docs/STANDARDS.md', present: false, speaks: false, text: null };
  try {
    const text = await readText(projectPath);
    project.present = true;
    if (text.trim() === '') findings.push('docs/STANDARDS.md is empty — the plugin default covers everything');
    else { project.speaks = true; project.text = text; }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      project.present = true;
      findings.push(`docs/STANDARDS.md could not be read (${error.code ?? error.message}) — the plugin default is serving alone`);
    }
  }
  const fallback = { path: defaultPath, present: false, text: null };
  try {
    fallback.text = await readText(defaultPath);
    fallback.present = true;
  } catch (error) {
    findings.push(`the plugin default at ${defaultPath} could not be read (${error.code ?? error.message})`);
  }
  if (!fallback.present && !project.speaks) throw new Error(`no standards referent resolves: ${findings.join('; ')}`);
  return { root: repository, project, default: fallback, findings };
}

function renderStandards(report) {
  const out = [];
  out.push(`# Standards referent — resolved ${report.project.speaks ? 'over' : 'from'} the plugin default`);
  out.push('');
  out.push(report.project.speaks
    ? `- project: ${report.project.path} — it speaks, and wins where it does`
    : `- project: ${report.project.path} — ${report.project.present ? 'present, but contributes nothing' : 'absent'}`);
  out.push(`- default: ${report.default.path}${report.default.present ? '' : ' — unreadable'}`);
  for (const finding of report.findings) out.push(`- note: ${finding}`);
  out.push('');
  if (report.project.speaks) {
    out.push('--- project docs/STANDARDS.md — wins where it speaks ---');
    out.push('');
    out.push(report.project.text.trimEnd());
    out.push('');
  }
  if (report.default.present) {
    out.push('--- plugin default — covers the rest ---');
    out.push('');
    out.push(report.default.text.trimEnd());
  }
  return `${out.join('\n')}\n`;
}

export async function main(args) {
  const [group, action, ...rest] = args;
  const root = process.cwd();
  if (group === 'state' && action === undefined) return output(await state(root));
  if (group === 'next-phase' && action) {
    // `--context` is additive and opt-in: the unflagged response is exactly what it has always been,
    // and the flagged one is that object with `context` beside it. One `readText`, one `parsePlan`,
    // and the same `nextPhase` throw on every ambiguous plan the parser already refuses — a
    // duplicate entry, an entry for an unknown phase, a plan with no phases — flag or no flag.
    if (rest.length > 1 || (rest.length === 1 && rest[0] !== '--context')) {
      throw new Error('usage: esq next-phase <plan> [--context]');
    }
    const plan = parsePlan(await readText(action));
    const verdict = nextPhase(plan);
    const next = { file: action, ...verdict };
    return output(rest.length === 1 ? { ...next, context: planContext(plan, verdict) } : next);
  }
  if (group === 'backlog' && action === 'reserve-id') {
    const file = rest[0] || path.join(root, 'docs/BACKLOG.md');
    return output(await reserveId(root, file));
  }
  // The block a working tree allocates from, reserving one under the shared lock when a linked
  // worktree has none. `scripts/worktree.sh` and `/esq:worktree` call it on the tree they just created.
  if (group === 'backlog' && action === 'reserve-block') {
    if (rest.length > 1) throw new Error('usage: esq backlog reserve-block [worktree-path]');
    return output(await reserveBlock(rest[0] ? path.resolve(root, rest[0]) : root));
  }
  const takeFlags = (args, names, usage) => {
    const positional = [];
    const flags = {};
    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];
      if (!arg.startsWith('--')) { positional.push(arg); continue; }
      const name = arg.slice(2);
      if (!names.includes(name) || args[index + 1] === undefined) throw new Error(usage);
      flags[name] = args[index + 1];
      index += 1;
    }
    return { positional, flags };
  };
  if (group === 'backlog' && action === 'set-status') {
    const usage = 'usage: esq backlog set-status <B-NNN> <status> [backlog] [--by <slug>] [--reason <text>] [--resolution <text>]';
    const { positional, flags } = takeFlags(rest, ['by', 'reason', 'resolution'], usage);
    const [id, status, file = path.join(root, 'docs/BACKLOG.md')] = positional;
    if (!id || !status || positional.length > 3) throw new Error(usage);
    return output(await setStatus(file, id, status, { by: flags.by ?? null, reason: flags.reason ?? null, resolution: flags.resolution ?? null }));
  }
  if (group === 'backlog' && action === 'rank') {
    const usage = 'usage: esq backlog rank --order <B-NNN…> [--backlog <path>] | esq backlog rank <B-NNN> (--after <B-NNN>|--before <B-NNN>|--last) [--backlog <path>]';
    let mode = null;
    let last = false;
    let after = null;
    let before = null;
    let backlog = null;
    const ids = [];
    const positional = [];
    for (let index = 0; index < rest.length; index += 1) {
      const arg = rest[index];
      if (arg === '--order') { mode = 'order'; continue; }
      if (arg === '--last') { last = true; continue; }
      if (arg === '--after' || arg === '--before' || arg === '--backlog') {
        const value = rest[index + 1];
        if (value === undefined) throw new Error(usage);
        if (arg === '--backlog') backlog = value;
        else if (arg === '--after') after = value;
        else before = value;
        index += 1;
        continue;
      }
      if (arg.startsWith('--')) throw new Error(usage);
      (mode === 'order' ? ids : positional).push(arg);
    }
    const file = backlog ? path.resolve(root, backlog) : path.join(root, 'docs/BACKLOG.md');
    if (mode === 'order') {
      if (positional.length > 0 || last || after !== null || before !== null) throw new Error(usage);
      return output(await rankOrder(file, ids));
    }
    if (positional.length !== 1) throw new Error(usage);
    return output(await rankPlace(file, positional[0], { after, before, last }));
  }
  if (group === 'backlog' && action === 'set-pri') {
    const usage = 'usage: esq backlog set-pri <B-NNN> <pri> [backlog]';
    const { positional, flags } = takeFlags(rest, [], usage);
    if (Object.keys(flags).length > 0) throw new Error(usage);
    const [id, pri, file = path.join(root, 'docs/BACKLOG.md')] = positional;
    if (!id || !pri || positional.length > 3) throw new Error(usage);
    return output(await setPri(file, id, pri));
  }
  if (group === 'backlog' && action === 'add') {
    const usage = 'usage: esq backlog add --type <type> --summary <text> --source <text> [--pri <pri>] [--epic <epic>] [--status <status>] [backlog]';
    const { positional, flags } = takeFlags(rest, ['type', 'summary', 'source', 'pri', 'epic', 'status'], usage);
    if (!flags.type || !flags.summary || !flags.source || positional.length > 1) throw new Error(usage);
    const file = positional[0] || path.join(root, 'docs/BACKLOG.md');
    return output(await addRow(root, file, { type: flags.type, summary: flags.summary, source: flags.source, pri: flags.pri ?? '', epic: flags.epic ?? '', status: flags.status ?? 'Open' }));
  }
  if (group === 'plan' && action === 'append-log') {
    // Before anything reads a path: `--help` must not depend on a plan file existing, and must not
    // read the one it is handed either.
    if (rest.includes('--help')) {
      process.stdout.write(renderAppendLogHelp());
      return;
    }
    const [file, json] = rest;
    if (!file || !json) throw new Error('usage: esq plan append-log <plan> <json> — `esq plan append-log --help` lists every accepted payload key');
    return output(await appendLog(file, json));
  }
  // The pause an open same-unit defect caused, and the only transition that resolves it. Read-only
  // without `--confirm`, one atomic rewrite with it, exit 1 on every refusal — /esq:build routes off
  // that and never off the prose.
  if (group === 'plan' && action === 'resolve-block') {
    const [file, ...flags] = rest;
    const usage = "usage: esq plan resolve-block <plan> [--confirm '<json>'] — the payload takes {phase, verified?, verification?}";
    if (!file) throw new Error(usage);
    if (flags.length > 0 && (flags[0] !== '--confirm' || flags.length !== 2)) throw new Error(usage);
    const result = await resolveBlock(root, file, flags.length === 2 ? flags[1] : null);
    output(result);
    if (result.refuse) process.exitCode = 1;
    return;
  }
  // The second writer of `**Verified:**`: the proof a /esq:fix item earned on the tree it committed,
  // appended under its own `### Phase N — reverified` heading. Exit 1 on every refusal, the plan
  // byte-identical — /esq:fix routes off `refuse` and never off the prose.
  if (group === 'plan' && action === 'record-verification') {
    const [file, ...flags] = rest;
    const usage = "usage: esq plan record-verification <plan> --confirm '<json>' — the payload takes {by, at, tree, step}";
    if (!file || flags.length !== 2 || flags[0] !== '--confirm') throw new Error(usage);
    const result = await recordVerification(root, file, flags[1]);
    output(result);
    if (result.refuse) process.exitCode = 1;
    return;
  }
  // One of the two header fields a command other than /esq:plan writes: the commit a clean review or converge
  // completion covered. Exit 2 on a value that is not a full commit this repository holds.
  if (group === 'plan' && action === 'set-reviewed') {
    const [file, commit, ...extra] = rest;
    if (!file || !commit || extra.length > 0) throw new Error('usage: esq plan set-reviewed <plan> <full-commit> — the commit is `git rev-parse HEAD` at the clean completion');
    return output(await setReviewed(root, file, commit));
  }
  // The one header field a user decision writes through the CLI: this plan of the unit will not be
  // built. Writes the file and commits nothing; exit 2 on every refusal, the file byte-identical.
  if (group === 'plan' && action === 'abandon') {
    const usage = 'usage: esq plan abandon <plan> --reason "<one line, at most 200 characters>" — writes the header marker and commits nothing';
    const [file, flag, reason, ...extra] = rest;
    if (!file || file.startsWith('--') || flag !== '--reason' || reason === undefined || extra.length > 0) throw new Error(usage);
    return output(await setAbandoned(root, file, reason));
  }
  // Read-only, writes nothing, and always exits 0: the range and the paths `/esq:review` reads, resolved
  // once against one pinned HEAD. Every answer it cannot narrow safely is `full`, and the one it cannot
  // answer at all is `unresolved` with `paths: null` — never an empty diff. `/esq:review` routes off `mode`.
  if (group === 'review' && action === 'scope') {
    const usage = 'usage: esq review scope <plan-path> [--full] | esq review scope <A>..<B> | <ref>';
    const flags = rest.filter((arg) => arg.startsWith('--'));
    const [target, ...extra] = rest.filter((arg) => !arg.startsWith('--'));
    if (!target || extra.length > 0 || flags.some((flag) => flag !== '--full')) throw new Error(usage);
    // A plan path or a git range, told apart by the one thing that cannot be both: a plan is a file
    // that exists on disk. Anything else is handed to git, which reports its own miss — so a mistyped
    // plan path never silently becomes a revision lookup that "succeeded" against nothing.
    const asPlan = await stat(path.resolve(root, target)).then(() => true, () => false);
    if (asPlan) return output(await reviewScope(root, target, { full: flags.includes('--full') }));
    if (flags.includes('--full')) throw new Error('esq review scope --full narrows a plan\'s own history; a named range is already the whole scope');
    return output(await reviewScopeRange(root, target));
  }
  // Read-only, opens two files at most, writes none, and always exits 0 when a referent resolves: the
  // standards a run arbitrates a stated constraint against. Prose by default, because the reader is a
  // run that is about to decide and needs the clauses in hand; `--json` is the same resolution with
  // both paths and both texts as fields.
  if (group === 'standards') {
    const flags = [action, ...rest].filter((flag) => flag !== undefined);
    if (flags.some((flag) => flag !== '--json')) throw new Error('usage: esq standards [--json]');
    const report = await standards(root);
    if (flags.includes('--json')) return output(report);
    process.stdout.write(renderStandards(report));
    return;
  }
  // Read-only, and always exit 0: whether docs/SPEC.md and the architecture projection still describe
  // HEAD, each proved from the commit its marker recorded. `/esq:land` routes off `fresh`.
  if (group === 'projections') {
    if (action !== undefined) throw new Error('usage: esq projections');
    return output(await projections(root));
  }
  // The plan a corrective brief corrects, and the ONLY place a `/esq:fix` run gets that path: the
  // brief it was handed is deleted by the end of the run, and `→ Next` names the plan after it is
  // gone. Refuses rather than ranks on each of its three grounds (no plan carries the slug, the
  // `Source:` and the filename disagree, two plans carry it), because which of the two carries the
  // mistake is not something this can know and a preference turns a visible clash into a silent
  // wrong answer. Reads the brief and one readdir; writes nothing.
  if (group === 'brief' && action === 'plan') {
    const [file, ...extra] = rest;
    if (!file || extra.length > 0) throw new Error('usage: esq brief plan <fixes-brief>');
    return output(await briefPlan(file));
  }
  // Read-only, opens no file, writes none, and always exits 0: how deep in the corrective chain a
  // plan or brief name sits, and whether another generation may be opened. `/esq:plan`, `/esq:check`
  // and `/esq:review` route off `verdict`, and an `exhausted` answer is not a failure to decode.
  if (group === 'brief' && action === 'depth') {
    const [file, ...extra] = rest;
    if (!file || extra.length > 0) throw new Error('usage: esq brief depth <plan-or-fixes-brief>');
    return output(briefDepth(file));
  }
  // Read-only, and always exit 0: which briefs under docs/plans still owe a plan, computed from the
  // plans beside them rather than from an mtime. `/esq:plan` takes `selected` when it was given no
  // target, and an empty `pending` is an answer it stops on — never a reason to reach for a brief
  // some plan already consumed.
  if (group === 'brief' && action === 'pending') {
    if (rest.length > 0) throw new Error('usage: esq brief pending');
    return output(await briefPending(root));
  }
  // The cheapest possible stop: one subprocess and one plan read, before the caller has read plan
  // content or written a byte. Exit 1 on refuse — /esq:build routes off that and never on the prose.
  if (group === 'branch' && action === 'check') {
    const [file, ...flags] = rest;
    const usage = 'usage: esq branch check <plan> [--at <full-commit>]';
    if (!file || (flags.length > 0 && (flags.length !== 2 || flags[0] !== '--at'))) throw new Error(usage);
    const result = await branchCheck(root, file, { at: flags.length === 2 ? flags[1] : null });
    output(result);
    if (result.refuse) process.exitCode = 1;
    return;
  }
  // Read-only, creates nothing, and always exits 0: every question it cannot answer comes back as a
  // `new` decision with its reason named. `/esq:plan` routes off `mode` and never off the prose.
  if (group === 'branch' && action === 'resolve') {
    const [slug] = rest;
    if (!slug) throw new Error('usage: esq branch resolve <slug>');
    return output(await branchResolve(root, slug));
  }
  // Read-only, and always exit 0: every question it cannot answer is a `run` decision with its reason
  // named, never a failure the caller has to decode. It runs no command it returns.
  if (group === 'gate' && action === 'verify') {
    // `--unit` widens the answer to every plan recording this plan's `**Branch:**` — what `/esq:land`
    // asks, because the merge takes the whole branch. Flags may come before or after the path.
    const flags = rest.filter((arg) => arg.startsWith('--'));
    const [file, ...extra] = rest.filter((arg) => !arg.startsWith('--'));
    const usage = 'usage: esq gate verify [--unit] <plan-path> [--workers-moved]';
    if (!file || extra.length > 0 || flags.some((flag) => flag !== '--workers-moved' && flag !== '--unit')) throw new Error(usage);
    return output(await gateVerify(root, file, { workersMoved: flags.includes('--workers-moved'), unit: flags.includes('--unit') }));
  }
  // A report, so it prints prose to the person who typed it and JSON to the relays that route off it.
  // Always exits 0: an incomplete answer is a shaped `unknown`, never a failure the caller decodes.
  if (group === 'evidence') {
    const flags = [action, ...rest].filter((flag) => flag !== undefined);
    if (flags.some((flag) => flag !== '--json')) throw new Error('usage: esq evidence [--json]');
    const report = await evidence(root);
    if (flags.includes('--json')) return output(report);
    process.stdout.write(renderEvidence(report));
    return;
  }
  // The group that writes to git, and the only one that does. One exit-code contract for all of it:
  // 0 when the verb did what it says, 1 on every refusal, so a caller routes off the status and never
  // off the prose. `begin` and `abort` are deliberately not policy-gated — the policy governs an
  // autonomous landing, and a user typing `/esq:worktree merge` is the authority; `scan` writes
  // nothing at all.
  if (group === 'merge') {
    const usage = 'usage: esq merge <begin <branch> [--into <dest>]|scan|seal|abort|land --plan <plan-path>>';
    // `begin` is the attended verb and takes the two refs from its caller. `land` takes none: both
    // of its refs come from the plan header it is pointed at, in-process, so no caller can aim an
    // unattended landing anywhere the plan does not name.
    const branchAndInto = () => {
      const [branch, ...flags] = rest;
      if (!branch) throw new Error(usage);
      let into;
      for (let index = 0; index < flags.length; index += 1) {
        if (flags[index] !== '--into' || !flags[index + 1]) throw new Error(usage);
        into = flags[index + 1];
        index += 1;
      }
      return [branch, into];
    };
    let result;
    if (action === 'begin') {
      result = mergeBegin(root, ...branchAndInto());
    } else if (action === 'land') {
      if (rest.length !== 2 || rest[0] !== '--plan') throw new Error(usage);
      result = await mergeLand(root, rest[1]);
    } else if (action === 'scan' && rest.length === 0) {
      result = await mergeScan(root);
    } else if (action === 'seal' && rest.length === 0) {
      result = await mergeSeal(root);
    } else if (action === 'abort' && rest.length === 0) {
      result = mergeAbort(root);
    } else {
      throw new Error(usage);
    }
    output(result);
    if (result.refuse) process.exitCode = 1;
    return;
  }
  // Read-only, writes nothing, and always exits 0: whether a chosen option's `do:` may be run by a
  // subagent (`apply`), must be run by the user themselves (`relay`), or cannot be classified at all
  // (`stop`) — and, for a relayed one, whether the ledger already shows it ran. The orchestrators route
  // off `route` and off `applied`, never off the prose.
  if (group === 'apply' && action === 'route') {
    if (rest.length === 0) throw new Error("usage: esq apply route '<do-string>' [more…]");
    return output(await applyRoute(root, rest));
  }
  if (group === 'validate' && action === undefined) {
    const result = await validate(root);
    output(result);
    if (!result.valid) process.exitCode = 1;
    return;
  }
  // The one subcommand that prints prose by default: the person asking "what did that cost" is
  // reading a terminal. `--json` gives the same numbers as one object (B-029 reads that). Never writes.
  if (group === 'telemetry' && action === 'summary') {
    const json = rest.includes('--json');
    const rows = rest.includes('--rows');
    const named = rest.filter((arg) => arg !== '--json' && arg !== '--rows');
    // `--rows` is a machine surface — the per-run join keys a caller attributes against a window
    // outside telemetry — and the report has no line for them. Refused rather than silently ignored,
    // so a caller that forgot `--json` learns it here instead of from an empty join.
    if (rows && !json) throw new Error('usage: esq telemetry summary --rows requires --json (the per-run rows are a machine surface, not part of the report)');
    const discovered = named.length ? null : await discoverTelemetryFiles();
    const options = discovered ? { searchedRoot: discovered.root } : {};
    if (rows) options.rows = true;
    const summary = await summarizeTelemetry(named.length ? named : discovered.files, options);
    if (json) return output(summary);
    process.stdout.write(renderTelemetrySummary(summary));
    return;
  }
  throw new Error('usage: esq <state|next-phase <plan> [--context]|branch check <plan> [--at <full-commit>]|branch resolve <slug>|brief depth <plan-or-fixes-brief> (the corrective generation, and whether another round may be opened)|brief plan <fixes-brief> (the plan a corrective brief corrects, validated against its Source:)|brief pending (the briefs under docs/plans that no plan has consumed yet)|backlog reserve-id|backlog reserve-block [worktree-path]|backlog set-status <B-NNN> <status> [--by <slug>|--reason <text>] [--resolution <text>]|backlog add --type <type> --summary <text> --source <text>|backlog set-pri <B-NNN> <pri>|backlog rank --order <B-NNN…> (the whole open sequence)|backlog rank <B-NNN> --after|--before <B-NNN>|--last (one placement)|plan append-log|plan resolve-block <plan> [--confirm <json>]|plan record-verification <plan> --confirm <json>|plan set-reviewed <plan> <full-commit>|plan abandon <plan> --reason <text>|gate verify [--unit] <plan-path> [--workers-moved]|review scope <plan-or-range> [--full] (a plan, or `<A>..<B>` for a change with no plan)|apply route <do-string>… (which of apply, relay or stop a chosen decision earns)|projections|standards [--json] (the standards referent a stated constraint is arbitrated against — a project docs/STANDARDS.md resolved over the plugin default)|evidence [--json]|merge begin <branch> [--into <dest>]|merge scan|merge seal|merge abort|merge land --plan <plan-path>|validate|telemetry summary [--json] [--rows] [file…]>');
}
