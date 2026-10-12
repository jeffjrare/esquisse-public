---
description: Land a finished, reviewed shipping unit on the branch it started from — durable prerequisites first, then the one merge engine.
name: land
argument-hint: "<plan> [--from <n>]"
disable-model-invocation: true
model: opus
allowed-tools: Bash(esq *)
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

Land one shipping unit into its recorded origin. Read durable prerequisites, run only verification whose proof cannot be reused, then call the merge engine, then carry the unit's rollout as far as esq can. No plan mode, subagents, finder or repairs. The merge is local; publishing it (push, deploy, release) stays the user's act, and every rollout step after it that esq can run, it runs.

The only authorized writes are **one evidence-backed backlog bookkeeping commit** at prerequisite 7, **one merge commit or none** through `esq merge land`, and **what a rollout step itself orders** (an evidence file and its commit, on the branch the step names). Never edit code, plans, briefs or projections, resolve conflicts, reassign IDs or switch branches otherwise.

Before recommending `/esq:plan` for a corrective brief, ask `esq brief depth <brief>`. At `exhausted`, route remaining 🟢 to `/esq:fix <brief>` followed by review; remaining 🟡/🔴 need their actual scope/constraint or explicitly accepted debt disposition, never a third corrective plan. `/esq:fix <brief> --accept <B-IDs>` can record the user's acceptance of matched findings; merely filing Open rows cannot clear landing. Never recommend abandoning a completed plan.

## Start and CLI

Before any tool call, announce and continue in the same response:

> `/esq:land — landing one shipping unit. Bound: no subagents, only the commands esq gate verify decides to run (on a red, at most its failing tests alone at HEAD and at the origin, and one re-run of the command), at most one backlog bookkeeping commit, exactly one merge commit or none, then each rollout step esq can run, once, up to the first one that is the user's.`

Stop at the bound and report anything not covered.

<!-- shared:resolve-cli:start -->
`esq` comes from the plugin's `PATH`: call it directly, never probe it first (`which`, `command -v`). If that call answers "command not found", run `"$CLAUDE_PLUGIN_ROOT/bin/esq"` — same command, explicit path. Stop only when neither runs, and say so in one line; never recompute by hand what the CLI owns.
<!-- shared:resolve-cli:end -->

The CLI owns branch/unit/coverage/destination facts, ledger validity, projection freshness and verification reuse. You judge delivery evidence and whether actual output meets a verification step's PASS criterion. No manual landing fallback.

Read each needed file or slice once and retain it; re-read only after a write or the explicit moving-state checks below. Batch independent readers. Chain ordered writes with `&&`; serialize same-file writes and all Git mutations.

## Preflight

1. Require `$0` to name a plan under `docs/plans/`, excluding `*.brief.md` and `*.log.md`. Missing → stop with `/esq:land docs/plans/<date>-<slug>.md`. Never choose the newest plan for a merge. `--from <n>` in `$ARGUMENTS` is a rollout re-entry: the user did the steps before `n`.
2. Batch `git status --porcelain`, `esq branch check <plan>`, `esq validate` and `esq projections`. Collect every result independently: check/validate may exit 1 with usable JSON, so do not short-circuit these readers with `&&`. Retain the branch verdict's head, recorded, origin, landed, unit (its `decisions` included), coverage, destination and removed.
3. Announce `Landing <slug> — <recorded> → <origin>.` With no origin: `Landing <slug> — legacy plan, nothing to land.`

## Prerequisites — first failure stops

Keep this exact order. Steps 1–11 use preflight facts except the bounded research/write in 7; verification comes only after them. A stop names the remedy and what did not run. Any backlog closure already committed in 7 stands even if landing later stops.

1. **Already landed:** `landed === true` or `'equivalent'` → report already landed, run no verification or merge, and go to **Rollout** from step `n` when `--from <n>` was given; otherwise stop. Read this **before refuse**: inspection from the destination may be a branch mismatch, and a deleted source branch may still be proved landed. `null` proves nothing; continue.
2. **Origin:** `origin === null` → `○ not landed legacy plan — it records no **Origin:**`; a no-op, not a failure.
3. **Branch:** `refuse: true` → stop. Mismatch/detached → `git switch <recorded>`, then this command again. Owned-elsewhere → relay reason verbatim and the attended `/esq:worktree merge <recorded> into <origin>` route. Never switch or repair a header yourself.
4. **Clean tree:** any porcelain output → stop, `git status`; user work is not yours to commit or discard.
5. **Whole unit complete:** `unit.incomplete` must be empty. It lists oldest-first plan/state/phase for every same-Branch plan neither complete nor recorded abandoned, including ready, paused, no-phases and invalid. Stop on the first: `/esq:build <plan>` for a buildable plan; a no-phases/invalid file needs its ledger defect resolved, not a build that cannot run. Offer the user's alternative: `esq plan abandon <plan> --reason "<why>" && git commit -m "plan(abandoned): <slug>" -- <plan>`. Never abandon yourself. Deletion is not abandonment; abandoned plans' promised rows and live briefs remain owed.
6. **Ledgers parse:** require `esq validate`'s `valid: true`; otherwise quote findings and stop with that diagnostic. Its `advisories` (an open row with no priority) are triage the user does whenever they choose: never a stop, an ask or a `→ Next`.
7. **Backlog disposed:** follow the disposition procedure below. Both `unit.open` and `unit.promised` must be empty afterward.
8. **No live findings:** `unit.findings` must be empty. These are existing corrective briefs whose Source joins a unit plan; never reconstruct deleted briefs. Across findings, 🔴 wins → `/esq:converge <brief>` to put the decision to the user; else 🟢 → `/esq:fix <brief>`; else `/esq:plan <brief>`. Report and stop, never run the finder/fixer.
9. **Removals accounted for:** `removed.uncovered` must be empty — every source module the unit deleted or left without an importer is named by a unit plan's `## Capability inventory`. Non-empty → stop, listing each path: `/esq:review <plan>` names the feature each powered and puts any drop to the user, even over a recorded clean review. `removed: null` (git could not answer) reports `○ removals not read` and continues.
10. **Review coverage:** require `coverage.verdict === "covered"`, using the CLI's unit-wide verdict. Stale → `/esq:review <coverage.plan>`, naming changed paths; corrected → the same target, one delta review after fixes; unproven → a first review. In each case use the input plan only when coverage.plan is null. Offer `/esq:converge <target>` as an unattended alternative, never a prerequisite. Do not infer coverage from headers, brief existence or commit subjects.
11. **Usable destination:** `destination.usable: true` continues, whether `here` or a clean linked `worktree`. False → report the site's reason and command **verbatim**, including its path, and stop before expensive verification. Never detach, switch, unlock, prune or remove another checkout.
12. **Owed verification passes:** run the verification procedure below.
13. **Assert the verified HEAD and merge:** one ordered call:
    `esq branch check <plan> --at <gate-head> && esq merge land --plan <plan>`.
    The first JSON is the branch assertion; the second exists only if it passed. `moved` means nothing merged or switched: report `moved during verification` and `/esq:land <plan>`. Pass only the plan to merge land, never caller-resolved refs or destination. The primitive reads Branch/Origin itself through safeRef and rechecks the landing site immediately before writing.

### Backlog disposition — prerequisite 7

List each owed row's id, status and source. Membership is the plans sharing Branch, not filename resemblance. Unit completion/review never proves all promises delivered.

- **unit.open:** never close here, even if also promised. Give the user's pair: fix → `/esq:work <id>`; accept unfixed → `/esq:backlog <id> dropped`. After recording any independent proved promises below, stop while it stands.
- **unit.promised:** research the row's whole promised outcome against the unit plans' Done looks like, execution logs and relevant committed work. Reuse evidence already held. **Delivered whole and verified, with a concrete commit/log citation** → close without asking:
  `esq backlog set-status <id> Done --by <delivering-plan-slug> --resolution "<delivery and verification citation>"`.
  The canonical value is `Done`; the CLI writes Status, provenance and Resolution together. Never call the user-reserved backlog skill.
- Clearly undelivered/partial → keep open and name `/esq:plan implement <id>: <summary>`. Only evidence genuinely split after research earns a delivered/not-delivered user choice; state the split. No closure from inference or to clear a gate.
- A row whose unit plan recorded a run-set verdict follows it, never a delivered/not-delivered choice (`D-a-measurement-verdict-is-settled-under-mandate`): a named next lever → `/esq:plan implement <id>: <lever>`; no lever within the stated bound → `esq backlog set-status <id> Dropped --reason "accepted limit: <verdict citation>"`, in the same backlog commit as proved rows.

Close all proved rows in ordered CLI calls, then one commit:
`git add docs/BACKLOG.md && git commit -m "backlog: close <n> row(s) delivered by <slug>"`.

Immediately re-run `esq branch check <plan>` and carry its updated head/unit/coverage forward; the bookkeeping moved HEAD but does not itself stale review or phase proof. If rows remain, stop after recording the proved subset. Closures stand on later refusal; name their evidence and bookkeeping hash. No other backlog edits are authorized.

### Verification — prerequisite 12

Call `esq gate verify --unit <plan>`, without `--workers-moved`, in the **invoking source checkout**, never the destination checkout. Retain its full head and compare it to the latest branch-check head **before executing any returned step**. Different → stop without running commands; report moved during verification and offer this landing again.

The gate covers all same-Branch plans, excluding abandoned unbuilt phases, and returns `commands`, `unresolved` and unit plans. Follow its decisions:
- `reuse`: use the existing PASS; never rerun for reassurance.
- `run`: execute each distinct returned command exactly once, even if several phases/plans named it.
- `resolved: false`: inspect and perform each full step; never skip or deduplicate it, or execute a lone document path as a command. If its action cannot be resolved, report the original step as unverified and stop landing; absence from `commands` is not a PASS.

Judge output against the returned **step text**, with its plan/phase, not exit 0 alone: a no-match grep can pass at exit 1. No replacement command or inferred suite subsumption, and no retry for its own sake.

**A red is diagnosed here, never handed to the user to reproduce.** Running a test is the run's work: a `→ Next` asking the user to re-run a command and report back is the defect this rule removes. Before stopping, in this order, each once:
1. **Its failing tests alone, at HEAD and at the unit's `**Origin:**`** (the runner's own file argument; the Origin in a detached `git worktree`, its untracked dependency directories linked rather than reinstalled, removed afterwards). Match failures by test name and message, never by line number.
2. **Red at both, the same way** → inherited, not this unit's: the step reads "this unit adds none" and is PASS. Merging adds no failure to the destination; report both readings as one `✔` line naming the inherited tests.
3. **Red alone at HEAD, green at the Origin** → this unit's regression, whether or not the unit touched that file: landing stops.
4. **Green alone at HEAD** → re-run the original command once. Green → a flake: PASS, reported as `○ flaky <test> — red in the full run, green alone and on re-run`. Red again → run the original command once at the Origin: red the same way → inherited (2); otherwise this unit's regression (3).

A regression stops landing with the failing step, plan, phase, at most ten output lines and each diagnostic reading; its `→ Next` is `/esq:work "<test> — red at landing of <slug>, green on its origin"`, then `/esq:land <plan>`.

An unrunnable command stops landing as unverified, even if a historical build logged a substitute. Report the original step and diagnosis for a prospective plan correction through build (unfinished phase) or the existing check/review → fix route (completed phase). Land makes no amendment and transfers no PASS; the corrected obligation needs its own proof under the normal freshness rules.

Reuse is the CLI's decision over recorded verified blocks, full commits, exact green commands and permitted changes, including any valid step-declared reads. Never recreate that algorithm. Bookkeeping is harmless only when it does not change an input named by the command or covered by its valid reads declaration; this includes plan logs and review/abandonment fields when the command reads that plan. Roadmap, epic and projection changes are not blanket harmless exemptions. Do not rewrite completed obligations to obtain reuse.

Before waiting on a slow command, print `⏳ <command> — expected <duration>, deadline <deadline>`. Expected duration comes from the plan/log; if absent, write expected unknown.

<!-- shared:collect-once:start -->
- **Collect a finite background check once.** Wait under a deadline or on actual process/task completion, never with an unbounded sentinel or repeated status polling. Use the collection primitive named by the launch result; do not assume an unavailable `TaskOutput` or `BashOutput`.
<!-- shared:collect-once:end -->

Confirm every process group this gate launched has ended before merging or reporting. A late collection or notification cannot change a failed result into a pass.

**No landing journal:** a green check run here is not recorded. If the merge then refuses, the next invocation may owe it again; only durable phase proof is reusable.

### Rollout — after the merge

Runs after `✔ landed` (from step 1) or on an already-landed unit with `--from <n>`. Number `unit.rollout` 1…N in its order. A step is **the user's** when it is tagged `(user)`, publishes (push, deploy, release, a merge into a branch other than the landing destination), or needs the user's own account, browser session, credentials or judgment. Every other step is **esq's**: a command, a read of a live URL, an evidence write and the commit the step orders. Never push or publish, whatever a step says — that step is the user's.

From the start step, in order: run each esq step **once**, judged against its text like an `(auto)` step (`⏳` line before a slow one). A red stops the rollout — the merge stands — with the step, at most ten output lines and `/esq:land <plan> --from <k>` once fixed. At the first user step `k`, stop: it is NEEDS YOU (1), verbatim with its source; when a later esq step consumes the user's answer (a confirmation, an observed value), ask for it in the same item. When the user confirms in this session, continue from `k+1` with the facts already held — no new verdict read, no prerequisite re-run. A step that writes evidence follows the plan's own instruction for where and how to commit; switching branches for it needs a clean tree, and you switch back after.

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
- **Rollout, whenever `unit.rollout` is non-empty:** under `Rollout`, each step numbered, with its source (`<plan> · plan` or `<plan> · Phase N`): `✔` ran, with its evidence; `→ you` the user step it stopped at; `○` not reached. Only the step it stopped at counts as NEEDS YOU.
- **Decided for you, whenever `unit.decisions` is non-empty:** once, under `Decided for you`, grouped Product / Architecture / Design (empty hats omitted), one `○` line each `<decision> · <plan> Phase N`, its `undo:` kept as written. It never stops, gates or adds to NEEDS YOU, and lands exactly as without it: silence is consent, because the merge is local and reversible. A reversal the user asks for is ordinary work, `/esq:work "<the undo>"`.
- **Every non-fresh projection:** `○ advisory <name> <verdict> — <owner>`, arch before spec. Include even when landing stops; never count advice as NEEDS YOU, make it Next, or run its owner.
- Passed prerequisites and measured elapsed, even on early stop.

Last line is `→ Next`, nothing after it. Repeat the first executable ask or name the decision then `/esq:land <plan>`. Choose the remedy for the stopping prerequisite: branch switch; git status; first incomplete plan's build/ledger repair; validate finding; actual backlog implementation/choice; brief action; removals review; coverage review; destination.command; for a failing auto step, the regression route above, never a command for the user to run and report; this landing for moved; merge result.command with cwd. Never let a generic backlog choice replace a clearly undelivered item's implementation command.

Stopped at user rollout step `k` → `→ Next: <step k, action-first> — then say done here, or later /esq:land <plan> --from <k+1>`. Landed/already landed (including up-to-date) with no rollout left → `nothing to run — the merge is local, and publishing it is a separate step`. Legacy → no landing to run. Never lower readiness requirements or turn projection advice into a requirement.
