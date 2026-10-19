# Fixes brief: Read the spec and architecture by section, know when they are stale, read CLAUDE.md once

Source: /esq:review on lean-projection-reads, 2026-10-19
Reviewed at: d1f6a69

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- `esq projection read` strips a `<!-- … -->` written inside an inline code span, so every plan/review/check/ideas run that reads such a section receives a rule with its subject deleted: on this repo `esq projection read arch 10` turns ARCHITECTURE.md:89 into "a projection's marker is ``, the commit being …" (the marker format is gone), line 17 loses the shared-marker syntax, and SPEC.md:376 reads "computed from the `` marker". An inline `` `<!--` `` with no `-->` on its line would also open a comment that swallows the following lines and hides their headings from the outline. This breaks the plan's Goal "without losing any evidence they relied on" — `plugin/lib/markdown.mjs:583` (stripComments' `rest.indexOf('<!--')`) and `plugin/lib/markdown.mjs:491` (structuralLines' comment tracking) — fix: skip `<!--` occurrences that fall inside a backtick code span (a run of N backticks up to the matching run of N on the same line) in both stripComments and structuralLines, and add a case to `tests/cli/projection-read.test.mjs` with an inline `` `<!-- last-spec: … -->` `` and an inline `` `<!--` `` followed by a heading — verify: `node --test tests/cli/projection-read.test.mjs && esq projection read arch 10 | grep -F '<!-- last-<name>: YYYY-MM-DD @ <full commit> -->'`

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
