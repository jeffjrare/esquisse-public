# Adopt an imported spec folder, and default to the user's proven stack

**Branch:** esq/spec-intake-reference-stack

**Origin:** main

## Context

On a real greenfield project (2026-11-20..21), the user imported ~25k words of chat-written specs into `docs/`: product briefs, a decision registry coded D1..D64, a module registry and a hand-written roadmap of prompts to paste. None of it was in esq's formats. It took 18 h from the import to the first code commit, across two sessions long enough to be compacted (6.3 MB and 3.7 MB of transcript). The 4-phase build and the converge that followed took about 1 h 10 (0.8 MB). The causes observed: esq reads none of those docs, so the user acted as the router. Contradictions and superseded content (a disposable prototype versus the real product, the code language, when the core record is born) surfaced one at a time. The user had to ask what was being built. The planner over-engineered isolation (row-level security) until the user pointed to their own proven stack in a sibling repo, and had to point to it twice. Today `/esq:harvest` mines git, plans, config and the first 30 lines of `docs/*.md`, writes `docs/DECISIONS.md` only, and stays silent on a folder of foreign specs. `/esq:status` rule 7 sends a project with no plan to `/esq:grill`, and `/esq:advance` stops on a missing roadmap with `/esq:roadmap plan`.

## Goal

A user who drops a folder of chat-written specs into a fresh repo gets told by esq, unprompted, to run one command. That one run gives them the overview of what they are building, the contradictions already settled in one round of questions, the decisions and modules in esq's ledgers, and a first plan whose architecture starts from their own proven stack.

## Done looks like

- In a fresh session in such a repo, Claude already knows (SessionStart) that `docs/` holds specs esq has not adopted. `/esq:status` and `/esq:advance` each name `/esq:harvest` as the one next step, and the user never writes a roadmap of prompts.
- One `/esq:harvest` run on that folder:
  - prints a short overview (what is being built, for whom, the first user journey, the first slice);
  - lists the contradictions and superseded passages it found;
  - asks **one** round of questions grouped by hat (product, architecture, design), recommendation first, only about what blocks the first slice;
  - writes `docs/DECISIONS.md`, with every entry citing its source document and keeping its original code (e.g. `D58`);
  - files one backlog row per module, plus one per open gate that blocks a module;
  - commits once and names `/esq:roadmap plan` as `→ Next`.
- With a reference-stack file present, `/esq:plan` and `/esq:grill` take its choices as the default and say so in one line. They depart only for a stated project requirement, and the departure is the user's call when it is a major architecture commitment. A project with no stack file sees no change.
- Nothing project-specific lands in this repository: fixtures and examples use invented names.

## Approaches considered

1. **An intake mode inside `/esq:harvest`, owning only `DECISIONS.md` and backlog rows (via `esq backlog add`).** One deterministic CLI inventory, one reconciliation read by harvest itself, one question round, one commit. Ordering and epics stay with their owners (`/esq:roadmap`, `/esq:epic`), reached by the printed `→ Next`. User benefit: the 18 h front end collapses into one run plus the existing roadmap step. Cost: one CLI verb, one skill reference, one routing rule. Limitation: the user runs two commands (harvest, then roadmap) before `/esq:advance` can take over, but each one names the next.
2. **A new `/esq:intake` skill that writes every ledger, epics and roadmap included, then hands straight to `/esq:plan`** (the counter-plan's phase 3–4 shape). It is one command fewer for the user, but it breaks one-writer-per-file (`D-roadmap-runs-on-a-mandate`; `/esq:epic` alone writes epics). It also chains commands, which `/esq:plan`'s mandate guard refuses, and it adds a 24th skill for what harvest already half does. Rejected on those constraints.
3. **Structural alternative, a durable intake ledger** (`docs/INTAKE.md`) recording each imported doc's disposition, re-read by later commands. Its benefit would be re-runnable adoption. It loses: provenance already lives where it is used (each entry's `**Fondement:**` and each row's `Source`), and a second authoritative file would be one more thing to keep in sync.

## Recommendation

Approach 1, plus a user-scope reference stack read by a new read-only verb.

- **Detection is deterministic and narrow.** Intake is *pending* when `docs/` holds at least 3 foreign Markdown files totalling at least 20 KB **and** there is no parseable esq registry. A missing `docs/DECISIONS.md` counts as no registry, and so does one that is not in esq's format. A file with a ledger's or projection's name counts as esq-owned only when it is in esq's format: SPEC and ARCHITECTURE need their `last-<name>` marker, BACKLOG its `| ID |` table, ROADMAP its `## Now` heading, DECISIONS its `| # |` table. Otherwise it is foreign (taken from the counter-plan and the pre-mortem). Every project that already runs esq has a registry and sees nothing new.
- **A foreign `docs/DECISIONS.md` is moved, never overwritten.** Harvest `git mv`s it to `docs/DECISIONS.imported.md` in its one commit, cites it from there, and lets `esq decisions add` create the registry.
- **The CLI reports syntax and locations; the model judges meaning and authority once.** A heading named `D58` defines `D58` syntactically. Whether that decision is *settled* is harvest's reading.
- **A chat-written "approved" is a found source, never a user answer.** It gets the `user — <path, date>` basis only when the document itself records an explicit approval, bounded to what it covers (harvest's existing rule, `D-harvest-basis-by-entry-origin`). Anything else is archaeology and carries no basis.
- **The reference stack** lives at `$ESQ_STACK`, else `${XDG_CONFIG_HOME:-~/.config}/esq/stack.md`: outside every repository and outside `~/.claude`. It is free Markdown, so the CLI returns its text and never parses it. It is a recorded user preference, so a choice it covers is no longer a question.
- **Counter-plan (Codex) merged:** ledger detection by format, keeping imported codes as aliases, the bound announced before reading, and the warning that a citation alone is not authority. Rejected: harvest writing epics and roadmap, and handing straight to `/esq:plan` (approach 2's constraints).

## Phases

### Phase 1 — Adopt an imported spec folder with `/esq:harvest`
- **Goal:** a user runs `/esq:harvest` on a folder of foreign specs and gets the overview, one question round, decisions and module rows in one commit.
- **Files touched:** `plugin/lib/intake.mjs` (new), `plugin/lib/cli.mjs`, `tests/cli/intake.test.mjs` (new), `tests/cli/fixtures/intake/` (new), `plugin/skills/harvest/SKILL.md`, `plugin/skills/harvest/references/intake.md` (new), `README.md`
- **Tasks:**
  - Task 1.1: feat(cli): add `esq intake inventory`, the deterministic map of imported spec docs.
    - `plugin/lib/intake.mjs` imports nothing from `cli.mjs`, so the Phase 3 hook can load it.
    - It walks `docs/` to depth 4, at most 500 entries, the overflow counted. It skips esq-owned paths:
      - the directories `docs/plans/`, `docs/epics/` and `docs/copy/`;
      - the top-level `PROMISES`, `LESSONS`, `EVIDENCE`, `CONFORMANCE`, `AUDIT` and `STANDARDS` `.md` files;
      - `SPEC`, `ARCHITECTURE`, `DECISIONS`, `BACKLOG` and `ROADMAP` only when they are in esq's format (Recommendation). Otherwise these are foreign, and `registryCollision: true` flags a foreign `DECISIONS.md`.
    - For each foreign Markdown file it answers path, bytes, words and headings (level, text, line).
    - Codes: tokens matching `[A-Z]{1,5}-?\d{1,4}(-\d{1,4})?` or `\d{1,2}\.[A-Z]`. A code is *defined* where it leads a heading, a table row's first cell or a file name, and *cited* elsewhere.
    - Links: Markdown links and backticked `docs/…` paths, each with a resolves/doesn't-resolve flag.
    - Aggregates: `undefinedCited`, `multiplyDefined`, non-Markdown files listed by name and size, and `pending` with its reason.
    - Read-only. Over `INLINE_OUTPUT_BUDGET` it spills to `<git-dir>/esq/intake.json` with `ranges`, as `esq state` does. Usage line added.
  - Task 1.2: feat(cli): `esq backlog add` creates `docs/BACKLOG.md` from `BACKLOG_TEMPLATE` when it is missing, as `esq decisions add` does for the registry.
    - The template already exists (`plugin/lib/cli.mjs:1258`), but `backlog add` reads the table through `reserveId` and fails on ENOENT. A fresh repo has no backlog, so without this harvest cannot file rows.
    - The created file is written atomically.
  - Task 1.3: feat(harvest): adopt an imported spec folder — reconcile once, ask once, write decisions and module rows.
    - `SKILL.md` gains one preflight call, `esq intake inventory`. When `pending` is true it announces the intake bound instead of the default one: `no subagents, at most 320 KB of imported docs read, one question round (at most 3 calls × 4 questions)`. It then makes the named load of `${CLAUDE_SKILL_DIR}/references/intake.md`. When pending is false, harvest runs exactly as today.
    - The reference reads the docs largest-value-first by the inventory outline, within the bound, and names whatever was left unread.
    - It reconciles: settled versus open decisions, contradictions, superseded passages (newest dated wins only when the newer text says it replaces the older one; otherwise it is a question).
    - It prints the overview: at most 10 lines, covering the product, its users, the first journey and the first slice.
    - It asks one round, grouped by hat, only on what blocks the first slice. Everything else stays open and is carried by the rows.
    - It writes through `esq decisions add`. Each entry keeps the source code in its title (`D58 — …`), and its context cites the doc path and heading.
    - It files modules and blocking gates through `esq backlog add --type todo --concern user --layer app --source "intake: <path>#<heading>"`. A gate-only row gets `--concern internal`.
    - On `registryCollision` it `git mv`s the foreign file to `docs/DECISIONS.imported.md` before the first `esq decisions add`.
    - It commits `DECISIONS.md` and `BACKLOG.md` (plus that move, when it happened) in one `decisions: adopt imported specs (<N> decisions, <M> rows)` commit, and ends with `→ Next: /esq:roadmap plan`. It never deletes or edits a foreign doc; a hand-written roadmap is reported as superseded once `/esq:roadmap` runs.
    - Harvest's constraint "one commit, one file" becomes "one commit; `DECISIONS.md`, plus `BACKLOG.md` in intake".
    - README: the `/esq:harvest` table row and the "New to a codebase?" paragraph.
- **Verification:**
  - `(auto)` `node --test tests/cli/intake.test.mjs` — the suite passes. Its fixtures cover:
    - the foreign/owned split, a code defined in a heading and cited in another file, a code cited but never defined, a code defined twice, and an unresolved link;
    - `pending` true with no registry, true with a non-esq `DECISIONS.md` (`registryCollision`), false with a parseable registry, and false under the size floor;
    - a foreign `SPEC.md` and a prompt-list `ROADMAP.md` (no `## Now`) counted as foreign, and an esq-format `ROADMAP.md` excluded;
    - the spill above the budget, and a `git status --porcelain` left unchanged;
    - `esq backlog add` in a repo with no `docs/BACKLOG.md`: it creates the file from the template, writes the row, and a second add appends.
  - `(auto)` `bash scripts/check-structure.sh` — exits 0: the `references/intake.md` load resolves and the README command table stays exhaustive.

### Phase 2 — Default plans and grills to the user's reference stack
- **Goal:** a user with a reference-stack file gets plans and grills that start from their proven choices instead of re-deriving or over-engineering them.
- **Files touched:** `plugin/lib/cli.mjs`, `tests/cli/stack.test.mjs` (new), `plugin/skills/plan/SKILL.md`, `plugin/skills/grill/SKILL.md`, `plugin/skills/harvest/references/intake.md`, `README.md`
- **Tasks:**
  - Task 2.1: feat(cli): add `esq stack`, the user's reference stack, read-only.
    - It resolves `$ESQ_STACK`, else `${XDG_CONFIG_HOME:-$HOME/.config}/esq/stack.md`.
    - It answers `{path, present, text, truncated, findings}`. An empty or unreadable file is a finding, never an error exit.
    - It never spills and never writes. Text over 16 KB is cut at a line boundary, with `truncated: true` and a finding: a reference stack is meant to be short. Its usage line is added.
  - Task 2.2: feat(skills): plan and grill start architecture choices from the reference stack.
    - `/esq:plan` preflight step 1, `/esq:grill`'s preflight and the harvest intake reference (before reconciling) each add `esq stack` to their first batch of calls.
    - Ask-altitude text in plan and grill: a choice the stack covers follows it, with the Recommendation (plan) or the brief's Resolved decisions (grill) carrying one line, `Reference stack: <choice> (<path>)`. A departure states the project requirement that forces it, and is put to the user only when it is a major architecture commitment.
    - The stack may name repos. A plan reads at most 5 files from them, and only when a choice needs a concrete pattern.
    - Absent file: nothing is said.
    - The harvest intake reference treats a spec choice that contradicts the stack as an architecture question. When the stack is absent and architecture choices remain open, it prints one line naming the path.
    - README: new subsection "Reference stack" under *Privacy and options*, with a template using invented names, plus the `/esq:plan` and `/esq:grill` rows if their behavior text changes.
- **Verification:**
  - `(auto)` `node --test tests/cli/stack.test.mjs` — the suite passes. It covers the `ESQ_STACK` override, the XDG fallback, the HOME fallback, an absent file (`present: false`, exit 0), an empty file (a finding), a 20 KB file (cut at a line, `truncated: true`), and no write anywhere.

### Phase 3 — Route a fresh project to the intake by itself
- **Goal:** the user never has to know the intake exists. The session, `/esq:status` and `/esq:advance` each name it as the one next step.
- **Files touched:** `plugin/lib/cli.mjs`, `plugin/lib/intake.mjs`, `plugin/scripts/session-expertise.mjs`, `plugin/hooks/hooks.json`, `tests/cli/intake.test.mjs`, `tests/hooks/session-expertise.test.mjs`, `plugin/skills/status/SKILL.md`, `plugin/skills/advance/SKILL.md`, `README.md`
- **Tasks:**
  - Task 3.1: feat(cli): `esq state` carries `intake: {pending, files, kb, reason}`.
    - The field is computed by the same `intake.mjs` function as `esq intake inventory`, so the two cannot disagree.
    - Additive only. It is `null` when `docs/` is absent.
  - Task 3.2: feat(hooks): SessionStart says when `docs/` holds specs esq has not adopted.
    - One line of at most 200 characters, added only when `pending` is true: `docs/ holds <n> spec documents (<kb> KB) esq has not adopted — /esq:harvest reconciles them into decisions and backlog rows.`
    - It reads directory entries, sizes and the first 4 KB of `docs/DECISIONS.md`. It never reads a foreign doc's content and never echoes a file name.
    - Same fail-silent contract. The existing expertise output stays byte-identical when the line is absent.
    - The `hooks.json` description is updated.
  - Task 3.3: feat(skills): status and advance route a pending intake.
    - `/esq:status` gets a new rule before rule 6, *No plan/brief action, `intake.pending`* → `/esq:harvest`, naming files and KB, and an `→ Also: /esq:harvest` line when a plan action wins.
    - `/esq:advance` step 1 checks `esq state`'s `intake.pending` **before** reading the roadmap, on an unscoped run. When it is pending, it stops before spending, naming `/esq:harvest`. This covers both a missing roadmap and a hand-written `ROADMAP.md` with no `## Now`.
    - README: `/esq:status` and `/esq:advance` rows, and the hook sentence under *How it works*.
- **Verification:**
  - `(auto)` `./scripts/audit.sh` — PASS. The product suites cover:
    - `tests/cli/intake.test.mjs` (the new `state().intake` cases: pending, not pending, no `docs/`);
    - `tests/hooks/session-expertise.test.mjs` (the line present and ≤200 characters with no fixture file name in it when pending; output byte-identical to today's when not pending);
    - plugin, structure and conformance checks.
  - `(auto)` `esq validate` — exits 0: no ledger defect.

## Risks

- **Pre-mortem: the user never runs it.** If the next intake is still found by luck, the 18 h repeats. Task 3.2 (the session line) and 3.3 (status/advance) answer this. The improvement itself is unproved until the next greenfield import is measured (turns, elapsed, question rounds against the 18 h baseline). That measurement happens after shipping, never as a gate. Paid behavioral runs (harvest on a fixture, plan with and without a stack) are lab instruments under CLAUDE.md rule 1. They are left explicitly unproved here, not bought as a gate: no deterministic check proves one question round or a stack-led recommendation.
- **Syntactic codes are noisy.** `UTF-8` or `ISO-8601` match the pattern. Defined-versus-cited, and the model's reading, filter them. The inventory never claims a code is a decision.
- **One question round cannot settle everything.** Unanswered gates stay as Open rows naming their codes. Silence is never approval.
- **The 320 KB bound can leave a critical doc unread.** The report names every doc left unread, and the outline lets harvest pick by headings first.
- **Stale projections.** `.claude/skills/plugin-runtime` says the SessionStart handler "reads only dependency key names", and `docs/ARCHITECTURE.md`'s ledger table omits harvest as a backlog writer. Both are `/esq:arch`'s to refresh; `/esq:status` flags it. Build must not edit them.
- **The hook's widening:** the guard is that the test asserts no file name appears in the line.

## Open questions

None. The user approved the three-part scope on 2026-11-21 ("Go"). Thresholds, paths and bounds are engineering calls recorded above.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-11-21

**Plan committed at:** 74f1d0e

**Commits:** 7250e9f, f3c5cdd, 769c722

**Verified:** 769c722d198a2925e1a6210940734ee7d4b366cb
- `node --test tests/cli/intake.test.mjs`
- `bash scripts/check-structure.sh`

**What got built:** `esq intake inventory` (new `plugin/lib/intake.mjs`, no import from cli.mjs) maps the Markdown under docs/ esq does not own — headings, codes defined and cited, link resolution, and a `pending` verdict — spilling to `<git-dir>/esq/intake.json` above the budget; `esq backlog add` now creates a missing `docs/BACKLOG.md`; `/esq:harvest` runs an intake (references/intake.md: one bounded reading, overview, one question round, decisions plus module and gate rows, one commit) when the inventory is pending.

**Verification:**
- (auto) node --test tests/cli/intake.test.mjs — 10 pass, 0 fail (foreign/owned split, heading/table/file-name definitions, undefined and doubly defined codes, link resolution, pending with no registry, with a foreign DECISIONS.md and under the floor, an esq registry, an esq ROADMAP.md excluded, the spill with git status unchanged, the 500-entry limit, backlog add creating BACKLOG.md then appending)
- (auto) bash scripts/check-structure.sh — exit 0: the references/intake.md load resolves, 23 commands covered by the README table
- (blast radius, not a plan step) ./scripts/audit.sh — exit 0, 7 checks clean, 26 s: cli.mjs is imported by every CLI suite and addRow is shared with lessons

**Decided for you:**
- architecture: `multiplyDefined` counts two definitions of the same kind (two headings, two table rows, two file names), so a registry's index row beside its section heading is not reported as a clash — that is how a registry is written — undo: change the filter on `multiplyDefined` in plugin/lib/intake.mjs
- product: an intake run replaces harvest's git/config/comment archaeology and interrogation rather than running beside them, since a fresh import repository has little history and one question round is the bound — undo: plugin/skills/harvest/SKILL.md preflight step 2

**Surprises / decisions made during execution:** - The plan's announce rule (bound before any tool call) and its intake bound (known only after the inventory) meet in the second line: the first line keeps the default bound, and when `pending` the resolved-target line restates the intake bound before any imported doc is read.
- `esq decisions add` requires all six text keys (tradeoff and consequences included); the intake reference says so, since the plan's entry description named only title and context.
- A code fence is skipped whole by the inventory (headings, codes and links inside it are not counted); the test asserts that.
- Added a 500-entry overflow test the plan did not list, after a mutation of the limit went unnoticed by the planned cases.
- README also gained the `esq intake inventory` clause in the CLI row and the BACKLOG-creation clause in the backlog paragraph, both behavior this phase changed.

**Backlog candidates:** None.

**For Phase 2:** 1. `plugin/skills/harvest/references/intake.md` exists; Phase 2 adds `esq stack` to its first batch before § 2 Reconcile. Harvest now carries `allowed-tools: Bash(esq *)`.
2. `scanDocs(root)` in plugin/lib/intake.mjs is the cheap half (walk, sizes, ledger-format checks) returning {pending, reason, registry, registryCollision, foreign, bytes, ...}; Phase 3's `state().intake` should call it, not `intakeInventory`. Note it reads the content of the five format-owned names (SPEC, ARCHITECTURE, DECISIONS, BACKLOG, ROADMAP), whereas Phase 3's hook may read only the first 4 KB of DECISIONS.md: the hook needs its own narrower read or a `scanDocs` option.
3. The usage string in cli.mjs' final throw lists `intake inventory`; add `stack` beside it in Phase 2.

### Phase 2 — completed 2026-11-21

**Plan committed at:** 1f3a636

**Commits:** 362bb92, d8a7259

**Verified:** d8a72592269b4c5b87ad96a3896fefab5efb3984
- `node --test tests/cli/stack.test.mjs`
- `./scripts/audit.sh`

**What got built:** `esq stack` returns the user's reference stack ($ESQ_STACK, else ${XDG_CONFIG_HOME:-$HOME/.config}/esq/stack.md) as {path, present, text, truncated, findings}, read-only and cut at a line past 16 KB; `/esq:plan`, `/esq:grill` and the harvest intake call it in their first batch and treat a covered choice as a recorded preference, with a README subsection and template.

**Verification:**
- (auto) node --test tests/cli/stack.test.mjs — 8 pass, 0 fail (ESQ_STACK override, XDG fallback, HOME fallback with an empty XDG_CONFIG_HOME counted as unset, absent file present: false and nothing created, empty file a finding, a directory path a finding, a 20 KB file cut at the last whole line under 16 KB with truncated: true and no write, the no-argument usage); each of 7 source mutations turned it red, source restored
- (blast radius, not a plan step) ./scripts/audit.sh — exit 0, 7 checks clean, 26 s: cli.mjs is imported by every CLI suite, and the skill and README edits fall under check-structure and check-plugin

**Decided for you:**
- product: in an intake, a spec choice that contradicts the reference stack is asked in the one round only when it bears on the first slice, else it is carried by a gate row — the round stays bounded to what blocks the first slice — undo: plugin/skills/harvest/references/intake.md § 2, the reference-stack bullet
- architecture: an empty XDG_CONFIG_HOME counts as unset, matching the shell's ${XDG_CONFIG_HOME:-…} the plan names — undo: `||` to `??` in stackPath, plugin/lib/cli.mjs

**Surprises / decisions made during execution:** - An unreadable path (a directory given as ESQ_STACK) is also a finding with present: true, tested, beside the empty file the plan named.
- `esq stack` takes no argument and refuses one with its usage line (exit 2).
- The README CLI row in *How it works* gained the `esq stack` clause in Task 2.1's commit, since the verb is user-visible behavior; Task 2.2 added the *Reference stack* subsection and changed the `/esq:plan` and `/esq:grill` rows.
- The usage text avoids an apostrophe because the whole usage string is single-quoted.

**Backlog candidates:** None.

**For Phase 3:** Phase 3 can proceed as planned, no surprises. `esq stack` is independent of `intake.mjs`; Phase 3's hook and `state().intake` should use `scanDocs` as Phase 1's hand-off says, with the hook's narrower 4 KB read of DECISIONS.md.
