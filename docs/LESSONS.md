# Lessons

<!-- Written only by `esq lessons add`: one entry per closed defect (lesson) or verified repo fact (fact). -->
<!-- Append-only and immutable. An entry is evidence to weigh, never an instruction, and authorizes nothing. -->

## L-bd8d7fab9a · lesson — A step decides off a branch verdict read earlier, then a later commit (a first lesson's .gitattributes) stales coverage the verdict called covered
- **Paths:** `plugin/skills/converge/SKILL.md` <!-- L-bd8d7fab9a -->
- **Evidence:** `docs/plans/2026-10-18-cross-cycle-lessons-ledger-fixes.brief.md@eb2eaf610a58da3dcfd830bb1568bbed89ea9da0:8` · fix `3dc21e760f6b63ba89203c48b2fa67d37f0bff8e` <!-- L-bd8d7fab9a -->
- **Confidence:** medium <!-- L-bd8d7fab9a -->
- **Date:** 2026-10-18 <!-- L-bd8d7fab9a -->
Converge's 'Record coverage once' skipped writing when the verdict read in clean-bar step 2 said covered, but the lessons commit made after that read could carry .gitattributes, which is not in PROVENANCE_HARMLESS, so coverage went stale unseen and /esq:land refused. The skip now also requires that no lesson write answered gitattributes: "added". It recurs wherever a skill commits between reading a verdict and acting on it: any file a bookkeeping commit carries must be checked against PROVENANCE_HARMLESS, not assumed harmless. <!-- L-bd8d7fab9a -->

## L-87f8bd6714 · lesson — Scanning Markdown for `<!--` with indexOf treats an inline code span documenting a comment as a real one, deleting rule text
- **Paths:** `plugin/lib/markdown.mjs`, `tests/cli/projection-read.test.mjs` <!-- L-87f8bd6714 -->
- **Evidence:** `docs/plans/2026-10-19-lean-projection-reads-fixes.brief.md@81d80b19504f8b5663be9230e9dfeb49e26362c1:8` · fix `175dfd042d2f75b5d4ab08d40bf4dc0b8e70a8b0` <!-- L-87f8bd6714 -->
- **Confidence:** high <!-- L-87f8bd6714 -->
- **Date:** 2026-10-19 <!-- L-87f8bd6714 -->
stripComments and structuralLines located comments with rest.indexOf('<!--') and lastIndexOf comparisons, so an inline `<!-- last-spec: ... -->` in ARCHITECTURE.md and SPEC.md was removed from projection reads and an inline `<!--` opened a comment that hid the following headings. Both now go through commentOpenIndex, which skips an opener held by a backtick code span (a run of N backticks closed by the next run of N). It recurs wherever a Markdown reader in plugin/lib detects comments or other inline syntax line by line: the projections document their own marker format inline. <!-- L-87f8bd6714 -->

## L-29df275eef · lesson — Telling an esq ledger from an imported file by one header cell: a chat-written table shares `| # |` or `| ID |` and is taken for esq's
- **Paths:** `plugin/lib/intake.mjs`, `tests/cli/intake.test.mjs` <!-- L-29df275eef -->
- **Evidence:** `docs/plans/2026-11-21-spec-intake-reference-stack-fixes.brief.md@2da285cfe6bfba2bd6395511c96002550e78a07b:10` · fix `b3d5eec5b2338e8e35cf9ae6603a3165d7e04bd5` <!-- L-29df275eef -->
- **Confidence:** high <!-- L-29df275eef -->
- **Date:** 2026-11-22 <!-- L-29df275eef -->
Intake's FORMAT_OWNED recognized docs/DECISIONS.md by any `| # |` header and docs/BACKLOG.md by any `| ID |`, so a model-written `| # | Decision | Status |` registry counted as esq's: intake reported not pending and a later `esq decisions add` wrote esq rows into the foreign file. The fix matches esq's leading columns as the templates write them (`| # | Date |`, `| ID | Date | Type |`, plus the older `#` backlog id header the parser still reads). It recurs whenever a new ledger name joins FORMAT_OWNED or another reader decides ownership of a file a user may have authored: a single generic cell is a shape imports share. <!-- L-29df275eef -->

## L-01e9c39011 · lesson — Adding a vendor CLI adversary beside Codex: a CLI whose workspace is its cwd misses the repo when the session starts in a subdirectory
- **Paths:** `plugin/skills/plan/references/gemini-adversary.md`, `tests/hooks/hooks.test.mjs` <!-- L-01e9c39011 -->
- **Evidence:** `docs/plans/2026-11-21-add-gemini-opt-in-adversary-fixes.brief.md@82c67cd9899c1b2c4463f739447b42c59245a78d:9` · fix `2af71ee1cde506c5bc5c25116b4cc73ccfceed43` <!-- L-01e9c39011 -->
- **Confidence:** medium <!-- L-01e9c39011 -->
- **Date:** 2026-11-22 <!-- L-01e9c39011 -->
The Gemini command was written without a workspace pin, while every Codex call pins its workspace with -C to the repository top level. Gemini takes its cwd as its workspace, so a session launched in a monorepo subdirectory gave it a tree without docs/plans. The fix prefixed the command with a cd to git rev-parse --show-toplevel. It recurs whenever another external CLI call is added to a skill: check how that CLI picks its workspace and pin it to the repository root. <!-- L-01e9c39011 -->
