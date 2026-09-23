# Baselines

A **baseline document** in this directory is one frozen reading taken by hand from one of this
repository's machine-local instruments, so that a later reading can be compared against it. One instrument produces one today:

- `<YYYY-MM-DD>-reread-baseline.json` — `scripts/measure-rereads.mjs`: how often esq-labelled runs
  re-accessed a path they had already accessed, by command × repository scope × rule presence.

It is not produced by `audit.sh`, and cannot be: it reads one machine's state, so a figure taken on
one laptop would redden a commit it did not cause.

**`<YYYY-MM-DD>-outcome-baseline.json` documents here are frozen history.** `scripts/outcome-join.mjs`
produced them by joining an assurance lane's cost against whether its work held; the lanes and that
script were removed on 2026-09-22, so nothing reads these files and nothing can reproduce one. They
are kept as the record of a measurement that was taken, not as a format anything still writes.

## The re-read baseline

The re-read instrument has no gate — it declares no threshold and proposes no disposition — so its
freeze is one command with **explicit, closed bounds**:

```bash
node scripts/measure-rereads.mjs --json --since <iso> --through <iso> > docs/baselines/<YYYY-MM-DD>-reread-baseline.json
git add docs/baselines/ && git commit -m "docs(baselines): freeze the re-read reading"
```

One pass carries every cohort, so **both rule-presence populations come from the same measurement**
rather than from two runs over a corpus that moved in between — the local transcript store is
unversioned and grows under the command, which is why a reading without a cutoff is not one. The
document carries `classifierVersion`: a reading taken at another version is not comparable with it,
and changing the needle, the delivery anchor or any classification rule requires bumping that number.

**What is in one.** `window` and `measuredAt`, `classifierVersion`, `versions` (every Claude Code
version the selected runs recorded), `corpus` — whole-store matching coverage, which takes no window,
beside the `selection` the window made, and `perCohortMatchCoverage: null`, which is the instrument
saying a figure it cannot compute rather than publishing one it cannot support — and `rows`, one cell
per command × scope × rule presence with its eligible run count, its eight class counts, its
classification coverage, its three turn/call counters, its withheld-path count and its top offenders.
It is aggregate and content-free: the only paths in it are repository-relative paths `realpath`
verified inside this repository, and no prompt, command or tool-result text is ever in it.

**Nothing reads these files automatically.** No check parses them, no command loads them, and no
verdict is computed from them. They are evidence a person cites when arguing about a workflow change,
and their value is entirely that they were frozen *before* the change they will be argued against —
`docs/BACKLOG.md` B-121 names the four rows (B-071, B-044, B-085, B-087) that stay blocked until one
of these exists.

**What is in one.** The whole report with the gate appended: `scope` (the three repository classes and
their counts), `identity` (every class count and the all-time coverage rate), `cohort` (its boundary,
first and last `recordedAt`, rows, identified, denominator and rate), `plans`, `segments` (the lane ×
model configuration × work size cells with their counts and rates) and `baselineGate` (its `ok`, the
coverage floor and sample threshold it applied, the repository key, the set-aside populations, the
three conditions with their verdicts and numbers, and `command` — the exact invocation that
reproduces it), plus `claudeCode`: the Claude Code version the reading was taken on, read once through
the same bounded `claude --version` seam `esq evidence` uses. The document is therefore
self-describing — nothing about which harness produced it depends on a commit message being written
correctly — and if that version cannot be read, the command exits 1 and writes nothing rather than
freezing a reading no later one can be compared against. It is aggregate and content-free: the only
names in it are committed plan slugs and one opaque repository digest.

**Not `docs/EVIDENCE.md`.** That registry's reader requires one JSON object per line carrying `cc` or
`init.claude_code_version`; a baseline is a single aggregate document, so registering it would be
documenting a procedure the reader rejects. The two are different instruments: `docs/EVIDENCE.md`
records what a Claude Code version was measured to do, and a baseline records what this repository's
own workflow cost and returned.

See README § *Cost beside outcome — what the join can and cannot say* for the gate's three conditions
and the ceiling its 95% floor is derived from, and README § *Re-reading — what the count can and
cannot say* for the three groups, the five rule-presence values, and the three things a re-read
reading cannot establish.
