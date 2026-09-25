---
description: Land a finished, reviewed shipping unit on the branch it started from — durable prerequisites first, then the one merge engine.
name: land
argument-hint: "<plan>"
disable-model-invocation: true
model: opus
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

Land one shipping unit into its recorded origin. Read durable prerequisites, run only verification whose proof cannot be reused, then call the merge engine. No plan mode, subagents, finder, repairs or publication. This is a local merge; putting it into service is a separate human step, never a command offered here.

The only authorized writes are **one evidence-backed backlog bookkeeping commit** at prerequisite 7 and **one merge commit or none** through `esq merge land`. Never edit code, plans, briefs or projections, resolve conflicts, reassign IDs or switch branches yourself.

Before recommending `/esq:plan` for a corrective brief, ask `esq brief depth <brief>`. At `exhausted`, route remaining 🟢 to `/esq:fix <brief>` followed by review; remaining 🟡/🔴 need their actual scope/constraint or explicitly accepted debt disposition, never a third corrective plan. `/esq:fix <brief> --accept <B-IDs>` can record the user's acceptance of matched findings; merely filing Open rows cannot clear landing. Never recommend abandoning a completed plan.

## Start and CLI

Before any tool call, announce and continue in the same response:

> `/esq:land — landing one shipping unit. Bound: no subagents, only the commands esq gate verify decides to run, at most one backlog bookkeeping commit, exactly one merge commit or none.`

Stop at the bound and report anything not covered.

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`. If `PATH` does not resolve it, run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

The CLI owns branch/unit/coverage/destination facts, ledger validity, projection freshness and verification reuse. You judge delivery evidence and whether actual output meets a verification step's PASS criterion. No manual landing fallback.

Read each needed file or slice once and retain it; re-read only after a write or the explicit moving-state checks below. Batch independent readers. Chain ordered writes with `&&`; serialize same-file writes and all Git mutations.

## Preflight

1. Require `$0` to name a plan under `docs/plans/`, excluding `*.brief.md` and `*.log.md`. Missing → stop with `/esq:land docs/plans/<date>-<slug>.md`. Never choose the newest plan for a merge.
2. Batch `git status --porcelain`, `esq branch check <plan>`, `esq validate` and `esq projections`. Collect every result independently: check/validate may exit 1 with usable JSON, so do not short-circuit these readers with `&&`. Retain the branch verdict's head, recorded, origin, landed, unit, coverage and destination.
3. Announce `Landing <slug> — <recorded> → <origin>.` With no origin: `Landing <slug> — legacy plan, nothing to land.`

## Prerequisites — first failure stops

Keep this exact order. Steps 1–10 use preflight facts except the bounded research/write in 7; verification comes only after them. A stop names the remedy and what did not run. Any backlog closure already committed in 7 stands even if landing later stops.

1. **Already landed:** `landed === true` or `'equivalent'` → report already landed and stop without verification/merge. Read this **before refuse**: inspection from the destination may be a branch mismatch, and a deleted source branch may still be proved landed. `null` proves nothing; continue.
2. **Origin:** `origin === null` → `○ not landed legacy plan — it records no **Origin:**`; a no-op, not a failure.
3. **Branch:** `refuse: true` → stop. Mismatch/detached → `git switch <recorded>`, then this command again. Owned-elsewhere → relay reason verbatim and the attended `/esq:worktree merge <recorded> into <origin>` route. Never switch or repair a header yourself.
4. **Clean tree:** any porcelain output → stop, `git status`; user work is not yours to commit or discard.
5. **Whole unit complete:** `unit.incomplete` must be empty. It lists oldest-first plan/state/phase for every same-Branch plan neither complete nor recorded abandoned, including ready, paused, no-phases and invalid. Stop on the first: `/esq:build <plan>` for a buildable plan; a no-phases/invalid file needs its ledger defect resolved, not a build that cannot run. Offer the user's alternative: `esq plan abandon <plan> --reason "<why>" && git commit -m "plan(abandoned): <slug>" -- <plan>`. Never abandon yourself. Deletion is not abandonment; abandoned plans' promised rows and live briefs remain owed.
6. **Ledgers parse:** require `esq validate`'s `valid: true`; otherwise quote findings and stop with that diagnostic.
7. **Backlog disposed:** follow the disposition procedure below. Both `unit.open` and `unit.promised` must be empty afterward.
8. **No live findings:** `unit.findings` must be empty. These are existing corrective briefs whose Source joins a unit plan; never reconstruct deleted briefs. Across findings, 🔴 wins → `/esq:converge <brief>` to put the decision to the user; else 🟢 → `/esq:fix <brief>`; else `/esq:plan <brief>`. Report and stop, never run the finder/fixer.
9. **Review coverage:** require `coverage.verdict === "covered"`, using the CLI's unit-wide verdict. Stale → `/esq:review <coverage.plan>`, naming changed paths; corrected → the same target, one delta review after fixes; unproven → a first review. In each case use the input plan only when coverage.plan is null. Offer `/esq:converge <target>` as an unattended alternative, never a prerequisite. Do not infer coverage from headers, brief existence or commit subjects.
10. **Usable destination:** `destination.usable: true` continues, whether `here` or a clean linked `worktree`. False → report the site's reason and command **verbatim**, including its path, and stop before expensive verification. Never detach, switch, unlock, prune or remove another checkout.
11. **Owed verification passes:** run the verification procedure below.
12. **Assert the verified HEAD and merge:** one ordered call:
    `esq branch check <plan> --at <gate-head> && esq merge land --plan <plan>`.
    The first JSON is the branch assertion; the second exists only if it passed. `moved` means nothing merged or switched: report `moved during verification` and `/esq:land <plan>`. Pass only the plan to merge land, never caller-resolved refs or destination. The primitive reads Branch/Origin itself through safeRef and rechecks the landing site immediately before writing.

### Backlog disposition — prerequisite 7

List each owed row's id, status and source. Membership is the plans sharing Branch, not filename resemblance. Unit completion/review never proves all promises delivered.

- **unit.open:** never close here, even if also promised. Give the user's pair: fix → `/esq:work <id>`; accept unfixed → `/esq:backlog <id> dropped`. After recording any independent proved promises below, stop while it stands.
- **unit.promised:** research the row's whole promised outcome against the unit plans' Done looks like, execution logs and relevant committed work. Reuse evidence already held. **Delivered whole and verified, with a concrete commit/log citation** → close without asking:
  `esq backlog set-status <id> Done --by <delivering-plan-slug> --resolution "<delivery and verification citation>"`.
  The canonical value is `Done`; the CLI writes Status, provenance and Resolution together. Never call the user-reserved backlog skill.
- Clearly undelivered/partial → keep open and name `/esq:plan implement <id>: <summary>`. Only evidence genuinely split after research earns a delivered/not-delivered user choice; state the split. No closure from inference or to clear a gate.

Close all proved rows in ordered CLI calls, then one commit:
`git add docs/BACKLOG.md && git commit -m "backlog: close <n> row(s) delivered by <slug>"`.

Immediately re-run `esq branch check <plan>` and carry its updated head/unit/coverage forward; the bookkeeping moved HEAD but does not itself stale review or phase proof. If rows remain, stop after recording the proved subset. Closures stand on later refusal; name their evidence and bookkeeping hash. No other backlog edits are authorized.

### Verification — prerequisite 11

Call `esq gate verify --unit <plan>`, without `--workers-moved`, in the **invoking source checkout**, never the destination checkout. Retain its full head and compare it to the latest branch-check head **before executing any returned step**. Different → stop without running commands; report moved during verification and offer this landing again.

The gate covers all same-Branch plans, excluding abandoned unbuilt phases, and returns `commands`, `unresolved` and unit plans. Follow its decisions:
- `reuse`: use the existing PASS; never rerun for reassurance.
- `run`: execute each distinct returned command exactly once, even if several phases/plans named it.
- `resolved: false`: inspect and perform each full step; never skip or deduplicate it, or execute a lone document path as a command. If its action cannot be resolved, report the original step as unverified and stop landing; absence from `commands` is not a PASS.

Judge output against the returned **step text**, with its plan/phase, not exit 0 alone: a no-match grep can pass at exit 1. No retry, extra check, replacement command or inferred suite subsumption. A red stops landing; show the failing step, plan, phase and at most ten output lines.

Reuse is the CLI's decision over recorded verified blocks, full commits, exact green commands and permitted changes, including any valid step-declared reads. Never recreate that algorithm. Bookkeeping is harmless only when it does not change an input named by the command or covered by its valid reads declaration; this includes plan logs and review/abandonment fields when the command reads that plan. Roadmap, epic and projection changes are not blanket harmless exemptions. Do not rewrite completed obligations to obtain reuse.

Before waiting on a slow command, print `⏳ <command> — expected <duration>, deadline <deadline>`. Expected duration comes from the plan/log; if absent, write expected unknown.

<!-- shared:collect-once:start -->
- **Collect a finite background check once.** Wait under a deadline or on actual process/task completion, never with an unbounded sentinel or repeated status polling. Use the collection primitive named by the launch result; do not assume an unavailable `TaskOutput` or `BashOutput`.
<!-- shared:collect-once:end -->

Confirm every process group this gate launched has ended before merging or reporting. A late collection or notification cannot change a failed result into a pass.

**No landing journal:** a green check run here is not recorded. If the merge then refuses, the next invocation may owe it again; only durable phase proof is reusable.

## Read the merge result

- Success: exit 0, `landed: true`, commit, destination and site.
- Refusal: exit 1, `landed: false`, verdict, reason and, when safe refs are known, command. Verdicts include plan, legacy, unsafe, destination, dirty, absent, self, up-to-date, merge-in-progress, conflict, collision, ask, markers and refused.
- Up-to-date and legacy are no-ops, not failures. Destination can become unusable during verification; the primitive checks it again.
- Relay command **verbatim**. If cwd is non-null, both ask and Next must say `in <cwd>: <command>`. Never invent a merge line, echo unsafe refs or repair missing authority to manufacture a command. A missing/unsafe-header refusal with command null reports the field to correct.
- The primitive aborts refused landings and restores the merge checkout's starting branch. Never retry it, resolve an ask/collision, stage a merge or run Git merge machinery yourself. The separate backlog commit, if any, remains.

## Report and next action

<!-- conclusion:start -->
Conclude with three zones, no preamble:

1. **Headline:** `<glyph> land — <slug> · <outcome/counters> · <measured elapsed> · NEEDS YOU (<n>)`. ✔ no user need, ⚠ a user gate, ✖ unable to do the job. Omit NEEDS YOU when empty; never soften an open gate.
2. **User needs:** numbered action-first asks with exact executable commands. Preserve genuine product choices' 🔴 options; copy manual verification verbatim with bracketed starting state. Omit on ✔. Ask only for user-owned intent/authorization, not a diagnosis the run can settle.
3. **Facts:** glyph, label, value, evidence. ✔ happened, ○ deliberately not, ✖ failed. Collapse empty categories; explicitly name prerequisites/verification skipped after a stop.
<!-- conclusion:end -->

Always include:
- **Landing:** `✔ landed <commit> <branch> → <destination>`, `✔ already landed <branch> → <origin>`, or `○ not landed <reason> <remedy>`. For site.verdict worktree, name the directory where the merge happened.
- **Closures, if any:** IDs, delivery evidence and bookkeeping commit, including on a later refusal.
- **Verification whenever the gate ran:** `<n> commands run, <m> reused across <p> plans (proved on <short hash>)`; show `0 reused`, not an omitted clause. Use returned proof hashes; do not invent a shared proof if they differ.
- **Every non-fresh projection:** `○ advisory <name> <verdict> — <owner>`, arch before spec. Include even when landing stops; never count advice as NEEDS YOU, make it Next, or run its owner.
- Passed prerequisites and measured elapsed, even on early stop.

Last line is `→ Next`, nothing after it. Repeat the first executable ask or name the decision then `/esq:land <plan>`. Choose the remedy for the stopping prerequisite: branch switch; git status; first incomplete plan's build/ledger repair; validate finding; actual backlog implementation/choice; brief action; coverage review; destination.command; failing auto step; this landing for moved; merge result.command with cwd. Never let a generic backlog choice replace a clearly undelivered item's implementation command.

Landed/already landed (including up-to-date) → `nothing to run — the merge is local, and publishing it is a separate step`. Legacy → no landing to run. Never lower readiness requirements or turn projection advice into a requirement.
