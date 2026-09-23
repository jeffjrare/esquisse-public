# Roadmap

<!-- The order of the work, and why that order. Managed by /esq:roadmap. -->
<!-- DURABLE: the sequence, and each entry's why now / needs / unblocks. Written by
     `/esq:roadmap plan` or an explicit `/esq:roadmap <change>` — never silently. -->
<!-- GENERATED: every `state:` line, rebuilt by scanning BACKLOG.md rows, docs/plans/
     execution logs and docs/epics/ on every run. Never hand-edit one. -->
<!-- NOT a copy of the backlog. An entry earns its place only when its position
     relative to other work is a real judgment. No cap per horizon or in total. -->
<!-- Unordered work stays in docs/BACKLOG.md and is reached with /esq:work. -->
<!-- Order re-derived 2026-08-26, superseding the two 2026-08-21 derivations and the horizon re-cut
     that followed them. What changed, and only this. (1) `audit-gate-reliability` moves into `Now` as
     the head. The re-cut left it in `Next` while the single `Now` entry above it named it as a `needs:`
     — a contradiction it recorded deliberately and left for the user; the entry now clears that same
     horizon lens on its own terms, because B-083 added the ask shape to B-062/B-065's announce bound,
     and both are contracts a user reads going unenforced on the tree the user actually installs.
     (2) B-068's half of that entry shipped on 2026-08-22 as audit checks 37/38, so the gate no longer
     reds at random and the entry's remaining defect is reach, not flakiness — its rationale is corrected
     rather than carried forward. B-082, which recorded the renumber that ship owed, is Done. (3) B-081
     and B-083 join `audit-gate-reliability`: B-081 is the stale check-count prose that would send a
     maintainer grepping a literal no longer in the tree, and it has to be corrected in the same pass
     that moves the count again. (4) `verification-collection-lifecycle` enters `Next` covering B-085
     and B-087, behind both `runtime-evals` and `outcome-instrumentation` — the safety half and the
     value half, both edges structural rather than preferential.
     Carried forward unchanged, because nothing gathered contradicts it: B-071/B-044 rewrite how agents
     read and how workflow state is transacted, so the behavioral safety net (B-032) and the outcome
     baseline (B-073) go first — an optimization measured only in tokens is exactly the "spend alone"
     argument D-tiers-held-until-a-second-cell-confirms already refuses; the worker-model evidence under
     every orchestrator spawn is dated to Claude Code 2.1.235 while this machine now records 2.1.239, so
     evidence freshness stays ahead of the work that quotes it; B-057 keeps its own entry, lower, because
     `esq lane stats` reports thin samples in three of four lanes today; B-001 stays out of the queue,
     parked on an external capability whose position is not ours to order, and B-075 is what makes that
     state readable. Deployment/DevOps remains out of scope; esquisse may consume an external acceptance
     signal without becoming a deployment product. B-076, B-078 and B-079 stay unordered in the backlog:
     each is reachable with /esq:work and none of their positions relative to this queue is a judgment
     anyone has had to make. -->
<!-- Inserted 2026-08-31, by explicit instruction and not by a re-derivation: `plan-owns-its-branch`,
     `declared-ship-policy` and `loop-lands-its-branch` enter `Next` ahead of `verification-collection-lifecycle`
     as one safe-shipping objective in that order. They are three entries rather than one because the order
     between them is the point — B-102 establishes branch ownership and the build preflight, B-101 declares
     how far a green loop may take the git work, and B-100 consumes both to do the landing — and only three
     entries can carry that as a `needs:` edge. B-100 needs both; the B-102 → B-101 order is positional, so
     neither carries an invented edge to the other. -->
<!-- Edited 2026-09-04, by explicit instruction and not by a re-derivation. `harness-evidence-freshness`
     ships: B-074 is Done, and B-047 was removed from its `covers:` rather than riding along to completion —
     it is an optional manual measurement (one interactive-pin row, or a documented interactive protocol) and
     the instruction is that it must not gate the optimization sequence. B-047 stays `Open` in the backlog with
     no roadmap entry and is reached with `/esq:work B-047`; nothing here closed it. `outcome-instrumentation`
     is promoted to `Now` in the vacated slot. `verification-collection-lifecycle` keeps both of its edges —
     B-085/B-087 stay blocked on B-073, which is now the head of the queue rather than the entry below it. -->
<!-- Edited 2026-09-05, by explicit instruction and not by a re-derivation. B-073 stays `Done` — the
     instrument shipped — so `outcome-instrumentation` is evicted to `## Shipped`, and `outcome-attribution-coverage`
     (B-121) takes the vacated `Now` slot as the prerequisite for a *usable* pre-change baseline: the join it feeds
     attributes only 11% of runs today. The two edges the shipped entry carried are re-pointed at it rather than
     dropped — `telemetry-round-trips-part-two` and `verification-collection-lifecycle` now name
     `outcome-attribution-coverage` in place of B-073, and B-085/B-087 stay blocked until that attribution coverage
     is usable; `runtime-evals`, their other edge, shipped 2026-08-31. B-047 is unchanged by this edit: still `Open`
     in the backlog, still off the roadmap, because its manual interactive-pin measurement is optional and must not
     gate the optimization sequence — reach it with `/esq:work B-047`. -->
<!-- Edited 2026-09-07, by explicit instruction and not by a re-derivation. `outcome-attribution-coverage`
     ships: B-121 is `Done` by owner decision at the observed identity coverage rather than at the 5-full-plan
     plus 5-conformity-plan collection floor, which that decision explicitly supersedes as a blocking condition —
     zero undeclared, unknown or stale identities, one reported ambiguous row, three exact legacy remaps, and
     `outcome-join` stays available as non-blocking monitoring. The entry is evicted to `## Shipped` and
     `telemetry-round-trips-part-two` (B-071, B-044, B-072) takes the vacated `Now` slot; its why-now is amended
     only where the demotion clause it opened with is now false, and carries forward otherwise unchanged.
     `verification-collection-lifecycle` (B-085, B-087) stays immediately behind it, and both of its edges are
     now satisfied rather than pending — `runtime-evals` shipped 2026-08-31, `outcome-attribution-coverage`
     2026-09-07 — so the `needs:` lines are kept as the record and the generated state says they are cleared,
     the same way `worktree-ledger-integrity` carries its shipped `audit-gate-reliability` edge. B-071/B-044 and
     B-085/B-087 take their safety from their own task-specific frozen baselines and runtime journeys, not from
     the outcome join. Nothing else was re-derived or reordered. B-103, B-127, B-129 and B-130 stay off the
     roadmap as non-blocking backlog work, reached with `/esq:work`. -->
<!-- Edited 2026-09-08, by explicit instruction and not by a re-derivation. `telemetry-round-trips-part-two`
     ships: B-071, B-044 and B-072 are all `Done`, so the entry is evicted to `## Shipped` and
     `verification-collection-lifecycle` (B-085, B-087) takes the vacated `Now` slot — the promotion the
     2026-09-07 edit already positioned it for, with nothing left in front of it. Its why-now is amended only
     in its closing clause, which ordered it behind the entry that has now landed; every other line, including
     both `needs:` edges kept as the record of what cleared them, carries forward verbatim. Nothing else was
     re-ordered, and no backlog item was touched by this edit. -->

<!-- Horizons, re-cut 2026-08-21 and honored here: `Now` holds only work an end user meets while using
     esq on their own project; everything whose payoff is measuring, auditing or guarding esquisse itself
     sits in `Next`. `audit-gate-reliability` crossing that line is the one horizon change this derivation
     makes, and it is made on the lens rather than around it — the re-cut named it a close call for exactly
     the reason that has since grown. `telemetry-round-trips-part-two` remains the other close call: felt
     by a user as a faster command, though what it ships is a measurement. -->

<!-- Order re-derived 2026-09-20, the first full re-derivation since 2026-08-26 (everything between was an
     explicit edit). What forced it: thirty-six Open/Planned rows had accumulated with no position, and the
     `esq-decides-implementation-detail` epic opened 2026-09-19 carrying a `## Order` the user decided
     themselves — four levers, A → D → B → C, with A and D as one shipping unit. A and D shipped on
     2026-09-19 (`docs/plans/2026-09-19-stop-applies-its-own-fix.md`, `D-a-repair-budget-replaces-the-ceiling`,
     `D-corrective-generations-bounded-at-two`), so lever B is what comes next and that is the user's call,
     not this derivation's. B-169 stays `Open` on purpose — it is the epic's row and covers all four levers.
     The structural change here: `verification-collection-lifecycle` leaves `Now` for the head of `Next`.
     Nothing contradicted its reasoning, which is carried forward whole; three entries with fresher and
     cheaper reasons simply arrived above it. Two of those are new judgments rather than new work.
     (1) Measuring what just shipped decays — `esq lane stats` is the only instrument that would say whether
     the corrective bound converged, and it is wrong at three sites today, so `convergence-measured` is worth
     more this week than it was last. It supersedes `lane-report-accuracy`, whose own why-now ("its data is
     not yet worth correcting") is exactly what stopped being true when D shipped.
     (2) A command that proposes a premature closure is a hazard to every entry below it, which is why
     `roadmap-tells-the-truth` sits above the entry it protects rather than with the other small fixes.
     Carried forward unchanged, because nothing gathered contradicts them: `command-file-drift-guards`,
     `worktree-ledger-integrity` (its `needs:` dropped — `audit-gate-reliability` shipped 2026-08-27 and a
     satisfied edge that has aged out of the tail would only raise `⚠ not found`), `projection-freshness`,
     `command-prose-reconciliation`, `legacy-tree-trim` and `harness-port-adapter-layer`, which keeps its
     defended demotion. Three entries are new groupings of previously unordered rows and earn their place on
     one edge each: `gate-guards-what-it-claims` must land before `legacy-tree-trim` deletes `commands/esq/`
     (B-110 and B-089 are the only comparison the plugin tree has), `registries-stay-true` collects five
     drifts the audit is green on — one of them corrected by hand twice, which is the repo's own threshold
     for mechanizing it — and `landing-gate-runs-what-it-should` covers two ways a correct unit is refused.
     Deliberately left unordered, reachable with `/esq:work`: B-001 (parked on an external capability),
     B-076, B-078, B-096, B-130, B-149, B-160, B-162. One row that had no position and needed one:
     B-070 is a confirmed `hi` still `Planned`, and leaving it off would have been the one move that makes
     this file untrustworthy — silently demoting the user's own priority. It heads `Later` with its defence
     stated, because the instrument it asked for shipped and supports no conclusion in either direction. B-149 in particular looks settled rather than pending —
     `esq brief pending` returns none, because `D-a-brief-is-consumed-by-the-plan-that-carries-its-slug`
     (2026-09-20) made consumption computed instead of recorded by deletion; `/esq:sweep` owns that call,
     not this file. Evidence staleness was weighed and left in `Later`: all three claims read stale against
     installed 2.1.278, but `harness-evidence-freshness` shipped the mechanism that says so, so a stale
     verdict is the system working rather than a lie being told. -->

<!-- 2026-09-22 — four entries left this queue because the refactor removed what they were about,
     not because anyone worked them. The narrative above predates that and is kept as the record of
     how this order was decided, so read it against this note:

     - `convergence-measured` (B-127, B-103, B-057) — every one of the three was a defect in
       `esq lane stats`, which retired with the assurance lanes. B-103's other half, `briefSlug`
       mis-splitting a `-fixes-2` name, was verified correct in the code at 58ddf9b and today.
     - `legacy-tree-trim` (B-012, B-131) — both rows are Done: the tree it would have deleted is
       gone, and the 500-line entrypoint cap B-131 was up against no longer exists.
     - `gate-guards-what-it-claims` — all six rows are closed. B-110, B-089 and B-157 shipped;
       B-109 is fixed by conventional test discovery (a hand-kept suite list was its cause);
       B-117 and B-091 guarded checks 42 and 40, both removed.
     - `journey-coverage-and-evidence-refresh` keeps its place and loses B-093, Dropped: the
       escalation behaviour it waited on was removed rather than repaired.

     Nothing here recreates a lane, a metric, an audit or a mirror to satisfy an older entry, and
     no remaining work was started. -->

## Now

### standards-referent
**covers:** B-169, epic:esq-decides-implementation-detail
**why now:** lever B of an order the user decided on 2026-09-19, and levers A and D shipped as one unit on that same day, so this is simply next — the position is the user's judgment, not this file's. What it buys: a durable document at `docs/SPEC.md` altitude for engineering and design defaults, consulted *before* a 🔴 is raised, so a stated constraint is arbitrated against a written standard instead of against the user. Verified 2026-09-19 that no such referent exists anywhere in `docs/` or `plugin/skills/`, which makes this an absence rather than a gap. It sits above the assurance work below it because the epic settles that question in its Goal: end-user value shipped fast is the first objective and everything else is instrumental to it.
**state:** <!-- GENERATED --> B-169 Open [hi] · epic Active, 1 plan tags it (`2026-09-19-stop-applies-its-own-fix.md`, levers A+D, complete) — lever B not started

## Next

### roadmap-tells-the-truth
**covers:** B-129, B-079
**why now:** above the entry it protects rather than filed with the other small fixes, because B-129 is a closure hazard and not a display bug: bare `/esq:roadmap` reads "plan complete + backlog row still `Planned`" as stale work and recommends `/esq:sweep`, ignoring an explicit post-plan completion condition — it proposed closing B-121 while the live baseline gate was exiting 3 at 56% coverage, and acting on that would have released B-085 and B-087 early and invalidated the pre-change baseline the entry below it depends on. B-079 rides along because it is the same file's other half-truth: the `→ Or: /esq:advance` offer still emits the whole-horizon form now that `/esq:advance <slug|B-NNN>` exists, so the one person looking straight at a single entry is offered the full horizon or nothing
**unblocks:** verification-collection-lifecycle
**state:** <!-- GENERATED --> B-129 Open [hi?] · B-079 Open [hi?] — not started (both levels raised from med?/lo? by `esq backlog rank`, which reads this entry's `unblocks:` edge onto `verification-collection-lifecycle` and its confirmed `hi`; suggested levels, so the promotion is a proposal to confirm, not a decision taken)

### verification-collection-lifecycle
**covers:** B-085, B-087
**why now:** behind two hard edges, both structural rather than rhetorical. B-085 is a `build` worker with no cheap way to wait for a finite check — 123 excess status round trips in 40 of 136 eligible agents, 16.1 M cache-read — and any protocol answering it changes *how a verification result is collected*, which is exactly what `D-wait-protocol-waits-for-the-safety-net` refuses to touch before `runtime-evals` exists: a wait that returns early and a check that passed are the same shape from the outside, and only a behavioral journey separates them. The second edge is the value half — the measurement in hand counts round trips saved, and `D-tiers-held-until-a-second-cell-confirms` already refuses to move a judgment-bearing rule on spend alone, so `outcome-instrumentation`'s baseline is what says a quieter build is still a correct one. B-087 joins it as the same lifecycle from the other end: a background worker stopped by PID keeps a harness registration alive and is resurrected by a `killed` notification 51 minutes later for a full-context turn, so whatever protocol B-085 writes for waiting must also say what a stopped worker's result is — split, the two would have separate rules deciding when a spawned check is over. **Demoted from `Now` on 2026-09-20 without its reasoning being contradicted:** every edge it names is still cleared and it is still the largest measured saving on the list. What changed is above it, not here — the user's own epic order arrived with a confirmed `hi`, and the instrument that would judge a quieter build got a fresher reason to be correct first. It is also the biggest and least certain entry in the file, which is the tiebreak this file uses last. Its `needs:` line is dropped rather than carried: both edges are satisfied and `runtime-evals` has aged out of the five-line tail entirely, so under `D-needs-blocks-on-queue-presence` the line would raise `⚠ needs: runtime-evals not found` on every refresh from here on — the dates stay recorded in `state:` instead
**state:** <!-- GENERATED --> B-085 Planned · B-087 Planned — in flight (both `Planned` against `2026-08-22-wait-once-and-a-named-payload.md`, superseded before any phase ran, so the rollup overstates it; the parked-work representation B-075 asks for is what would render this honestly. Edges: `runtime-evals` shipped 2026-08-31, `outcome-attribution-coverage` 2026-09-07 — both cleared)

### landing-gate-runs-what-it-should
**covers:** B-107, B-163
**why now:** two ways a correct shipping unit is refused or mis-executed at the gate, which is the most expensive class of defect in a repo whose objective is shipping: `/esq:converge`'s landing gate re-runs every phase's `(auto)` step with no equivalent of build's second exception, so a branch whose plan carries an unrunnable command cannot land even though the phase that wrote it completed; and `extractAutoCommand` (`plugin/lib/markdown.mjs:267`) takes the single inline-code span before the em dash whatever it holds, so a step whose only span is a file path hands `esq gate verify` a plan path to execute and the gate reds on something that was never a command. One reader over the gate's two entry points. Above the guard work because a gate that refuses correct work costs a session each time, where an unguarded invariant costs one only when someone breaks it
**state:** <!-- GENERATED --> B-107 Open · B-163 Open — not started

### registries-stay-true
**covers:** B-114, B-158, B-141, B-122, B-113
**why now:** five registries and tables that drift with the audit green, grouped because one of them has crossed this repo's own threshold for mechanizing a rule: README § Model recommendations has been corrected by hand twice (2026-08-19, 2026-09-03) and nothing checks it against the skills' actual `model:` frontmatter, so the table tells a reader the wrong model to set their session to. The other four are the same defect in the registries a reader trusts most — a `D-<slug>` cited inside a skill that no longer resolves, two contradicting `Active` decisions where one reverses the other, a `scripts/` entry missing from README's Operations table, and an audit green line that under-reports its own coverage. Below `gate-guards-what-it-claims` because those six are the gate failing to run; these five are the gate never having been asked
**state:** <!-- GENERATED --> B-114 Open · B-158 Open · B-141 Open · B-122 Open · B-113 Open — not started

### command-file-drift-guards
**covers:** B-022, B-004, B-010, B-064
**why now:** four load-bearing paragraphs across the same 16–20 command files that no registry or needle holds — the mandate guard, the citation-key invariant, the announce-open block, and `/esq:work`'s "A failed anchor never unwinds the code." One pass over those files closes all four, and doing them in separate sittings pays that pass four times; cheapest and lowest-risk work on the list. B-064 joins the three it was not filed with because an unpinned load-bearing sentence and an unregistered shared one are the same defect seen from two checks
**state:** <!-- GENERATED --> B-022 Open · B-004 Open · B-010 Open · B-064 Open — not started

### worktree-ledger-integrity
**covers:** B-003, B-005
**why now:** the collision the whole reservation scheme exists to prevent is reachable today through documented use (`rm` an unmerged worktree, then create another), and the merge branch that catches it has never been run — fix and fixture defend one invariant from both ends, in one pass over `worktree.md` and the scratch-repo harness. It was held behind a trustworthy gate to prove the fixture fires; `audit-gate-reliability` shipped 2026-08-27, so the edge is satisfied and the line is dropped rather than left pointing at an entry that has aged out of the tail
**state:** <!-- GENERATED --> B-003 Open · B-005 Open — not started

## Later

### reread-cost-awaits-a-supportable-reading
**covers:** B-070
**why now:** a confirmed `hi` in `Later`, which needs defending, and the defence is the strongest kind — the measurement this item asked for was bought and it settles nothing. `scripts/measure-rereads.mjs` shipped as B-151 with `docs/baselines/2026-09-11-reread-baseline.json`, and its own conclusion is that on a corpus of this shape it resolves 6% and 2% of repeated access, so **no comparison between the rule-loaded and rule-absent cohorts is supportable in either direction**; the historical 4.8 re-reads/run is not a comparand because its definition was never recorded and v3 counts a different thing. Acting on it now would be optimizing against a number no reading supports, which is exactly what `D-tiers-held-until-a-second-cell-confirms` refuses. It keeps its `hi` and its closing condition untouched, and it is not `Dropped`: the item is waiting on a reading that could support it, and whether any later evidence meets that condition is an argument a later proposal must make in the open. Above the rest of `Later` because it is the one entry there that a single better instrument could promote overnight
**state:** <!-- GENERATED --> B-070 Planned [hi] — in flight (`2026-08-21-read-once-and-see-round-trips.md` complete; it delivered the B-151 instrument, not the improvement B-070 asks for, so the row stays open by design)

### journey-coverage-and-evidence-refresh
**covers:** B-094, B-133, B-095, B-118, B-047
**why now:** in `Later` on purpose, and the staleness is the argument for it rather than against it: all three claims in `docs/EVIDENCE.md` read stale against installed 2.1.278 (measured on 2.1.235, 2.1.238 and 2.1.251), which is `harness-evidence-freshness` working exactly as shipped — a stale verdict is the system telling the truth, not a lie needing urgent correction. Two things must happen in order inside it whenever it is picked up: B-094 first, because every journey added otherwise re-derives every mutation that came before it, then B-133, because promoting a journey needs a whole-registry re-buy of about $3.75 that nothing warns about before the money is spent. B-093 is the reason the expansion is not merely nice — the escalation journey did not fire in two billed runs, so U-06's runtime evidence cannot be minted at all. B-047 rides here rather than standing alone: it is one optional interactive-pin measurement that must not gate anything, which is the position it has held since 2026-09-04
**state:** <!-- GENERATED --> B-094 Open · B-133 Open · B-095 Open · B-118 Open · B-047 Open [med] — not started

### projection-freshness
**covers:** B-043, B-075
**why now:** deliberately after the reliability and cost work — it touches how read-only state reports authority (`roadmap.stale`, live status beside projected text) and must not destabilize the single-writer rules while the entries above are still moving. B-075 joins it rather than standing alone because it is the same defect from the other side: B-043 is a projection that reports stale status as current, B-075 is a ledger with no way to say "parked" at all, so B-001 reads `Open` and B-006 rolls up as `in flight` against a standing decision that says otherwise. One pass over how state is reported answers both, and splitting them would have two commands deciding what an inactive item looks like
**state:** <!-- GENERATED --> B-043 Open [lo] · B-075 Open [med] — not started

### command-prose-reconciliation
**covers:** B-013, B-014, B-021, B-024, B-050, B-052, B-056, B-165
**why now:** eight prose contracts that drifted from the commands they describe — check's verdict sentences, ui's brief template, the install.sh-before-audit.sh ordering, spec's unanswered answer, the headless `--permission-mode` clause and its own stale correction, check/review's duplicated lane preflight, and build's failure route telling a worker to "report in the three zones" without loading the block that defines them. None is mechanical, so none of them reds; they need one reader's eye in one sitting rather than eight, and they go last among the real work because not one of them makes anything else cheaper
**state:** <!-- GENERATED --> B-013 Open · B-014 Open · B-021 Open · B-024 Open · B-050 Open · B-052 Open · B-056 Open · B-165 Open — not started

### harness-port-adapter-layer
**covers:** B-006, docs/plans/2026-08-15-harness-port-adapter-layer.md
**why now:** a confirmed `hi` placed last on purpose, which needs defending: a second install target multiplies every contract above it by two harnesses, so it was shelved on 2026-08-18 and nothing since has changed that reason — no external need for a Codex target has appeared, and the contracts landing above it (journeys, evidence stamps, outcome measures, round-trip shape, and now a standards referent) are all things a port would otherwise have to chase mid-flight. Each entry that stabilizes a contract makes this cheaper rather than more urgent; the demotion is the judgment, not an oversight. Its `state:` reads `in flight` only because B-006 is `Planned` against a plan with no phase logged — the parked-work representation B-075 asks for is what would render it honestly
**state:** <!-- GENERATED --> B-006 Planned [hi] · plan not started (6 phases, none logged) — in flight

## Shipped
<!-- Entries whose covered work is all Done/Dropped. Newest first, 5 kept. -->
- 2026-09-21 · observation-path-before-manual — docs/plans/2026-09-18-observation-path-before-manual-fixes.md, B-167 (done)
- 2026-09-08 · telemetry-round-trips-part-two — B-071, B-044, B-072 (done)
- 2026-09-07 · outcome-attribution-coverage — B-121 (done)
- 2026-09-05 · outcome-instrumentation — B-073 (done)
- 2026-09-04 · harness-evidence-freshness — B-074 (done)
