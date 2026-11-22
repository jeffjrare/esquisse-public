# Intake — adopting an imported spec folder

Loaded by `/esq:harvest` when `esq intake inventory` answered `pending: true`: `docs/` holds Markdown that esq does not own
(briefs, a decision list, a module list, a roadmap of prompts written elsewhere) and there is no esq registry. This
procedure replaces harvest's archaeology, interrogation and write phases. One reading, one question round, one commit. The
user never acts as the router between their own documents.

**Bound, already announced:** no subagents, at most 320 KB of imported docs read, one question round (at most 3
`AskUserQuestion` calls × 4 questions). Reaching it stops the reading, never the run: what was left unread is named in the
report.

**The inventory is syntax and locations; you judge meaning and authority, once.** A heading that leads with `D58` defines `D58`
syntactically. Whether that decision is *settled* is your reading. A code is not a decision because it matches: `UTF-8` matches
too.

## 1 — Choose what to read

From the inventory's `files` (path, bytes, words, headings) pick the docs that carry the product first: what is built and for
whom, the journeys, decisions, modules, then everything else. Sum `bytes` until 320 KB. A doc too large for what is left is
read by slices: take the line ranges under its relevant headings from the outline. Send every chosen `Read` together in one
turn, with `esq stack` beside them: the user's reference stack, the choices proven on their own projects. It does not count
against the 320 KB. Keep the list of docs and sections left unread for the report.

A foreign `docs/SPEC.md` or `docs/ARCHITECTURE.md` (the inventory's `ledgers` answers `foreign`) is an imported doc and is read
like one. The projection verbs serve esq's own projections only.

## 2 — Reconcile, in your head

Write nothing yet. From what you read and the inventory's aggregates, settle:

- **Decisions, settled or open.** Settled only when the text records it as decided. **A chat-written "approved" is a found
  source, never a user answer:** it earns the `user — <path, date>` basis only when the document itself records an explicit
  approval, bounded to what that approval covers (`D-harvest-basis-by-entry-origin`). Everything else is archaeology and
  carries no basis.
- **Contradictions:** two passages that cannot both hold. `multiplyDefined` is where to look first, since a code defined twice
  is often one.
- **Superseded passages.** The newest dated text wins only when it says it replaces the older one. Otherwise the pair is a
  question, never a silent pick.
- **Modules:** each feature unit the docs name, and **gates**: an open decision that blocks a module.
- **The reference stack.** A spec choice that contradicts `esq stack`'s text is an architecture question: asked in § 4 when it
  bears on the first slice, else carried by a gate row like any other open one. A choice the stack covers and the specs leave
  open is settled by the stack, never asked. With `present: false` and architecture choices still open, § 3 adds one line:
  `No reference stack at <path> — record your proven choices there and /esq:plan starts from them.`
- **Gaps:** `undefinedCited` (a code cited that no doc defines), links with `resolves: false` (a doc that was never written).

## 3 — Print the overview

At most 10 lines: the product, its users, the first user journey and the first slice. Then one line per contradiction and per
superseded passage, each naming its two sources (`path § heading`). Then the docs left unread, if any.

## 4 — Ask one round

One round, grouped by hat (product, architecture, design), and only on what blocks the first slice: a contradiction or an
open gate the first slice cannot be planned around. Each question puts the recommendation first, marked `(recommended)`, with
at most 3 curated options plus the free-text escape harvest's interrogation defines. Without `AskUserQuestion`, ask the same
round in one plain-text message. Nothing that does not block the first slice is asked: it stays open and its row carries it.
**Silence is never approval.** An unanswered question leaves its gate an Open row naming its code.

## 5 — Write

The writes touch the same files, so they are chained with `&&` in one call, never side by side.

1. **On `registryCollision`**, first: `git mv docs/DECISIONS.md docs/DECISIONS.imported.md`. The foreign registry is moved,
   never overwritten, and is cited from its new path.
2. **Decisions**, through `esq decisions add -` with one array in a heredoc, **only when at least one decision was settled or
   answered**: the CLI refuses an empty array, so with none this step is skipped, never run empty. One entry per settled or
   answered decision; an open one becomes a gate row, not an entry. Each entry:
   - keeps its source code in `title` (`D58 — Weekly order cut-off`), its `slug` derived from the title as harvest's write
     phase says;
   - cites the doc in `context` (`docs/<path> § <heading>`), with `decision`, `reason`, `tradeoff`, `consequences` and
     `alternatives` all required ("None documented" where the docs name none);
   - carries `fondement` by origin: `user — /esq:harvest intake, <YYYY-MM-DD>: "<the question as asked>" → <the operative
     words>` for an answer; `user — <path>, <date>` for a found explicit approval; omitted for everything else.
3. **Rows**, one `esq backlog add` per module and per gate that blocks one. `esq backlog add` creates `docs/BACKLOG.md` when the
   repository has none.
   - A module: `--type todo --concern user --layer app --summary "<module>: <what the user gets>" --source "intake: <path>#<heading>"`.
   - A gate: `--type todo --concern internal --layer app --summary "Gate <code>: <the open question> — blocks <module>" --source "intake: <path>#<heading>"`.
4. **Commit once,** staging only the ledgers this run wrote: `git add docs/BACKLOG.md`, plus `docs/DECISIONS.md` when step 2
   ran (a path never written is a pathspec `git add` refuses), then `git commit -m "decisions: adopt imported specs (<N> decisions,
   <M> rows)"`. The move from step 1 is already staged and lands in the same commit. The esq `docs/BACKLOG.md` step 3 wrote is
   what clears the pending intake when no decision was written.

Never delete or edit a foreign doc. Ordering belongs to `/esq:roadmap`, epics to `/esq:epic`: a hand-written roadmap is
reported as superseded once `/esq:roadmap plan` has run, and nothing here writes either.

## 6 — Report

The headline (decisions written with their IDs, rows filed with their IDs, the commit), then what needs the user (the gates
left open, the docs left unread), then the undo (`git revert <commit>`). End with:

> `→ Next: /esq:roadmap plan`

The elapsed time comes last, on its own line, as harvest's write phase says.

## Constraints, amended

Harvest's constraints hold, with one change: the commit carries `docs/BACKLOG.md`, plus `docs/DECISIONS.md` when a decision
was written and the move of a foreign registry when there was one. Nothing writes the roadmap, an epic, a plan or a foreign doc.
