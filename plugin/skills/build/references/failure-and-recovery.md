<!-- loaded-at: `${CLAUDE_SKILL_DIR}/references/failure-and-recovery.md`: you MUST load it the moment any condition above holds -->
## The failure report, the decision and the recovery

Report in the three zones, with the decision as zone 2:

```
✖  build — <slug> · Phase 3/5 <name> · 2 commits · 9m · repairs 2/3 · NEEDS YOU (1)

  1  <the 🔴, option-set shape below — verb first, ≤10 words; options and leaning under it>

  ✔ committed  a3f21c9, 8b40e11       tasks 1–2
  ✖ broke at   task 3 — <the step>
     <the failing output, verbatim, ≤10 lines — never a paraphrase of it>
  ○ not run    tasks 4–6
  ○ repo       <git log --oneline -5, so the user can judge a rollback>

→ Next: <the chosen option's `do:`, or the diagnosis's exact action, then /esq:build docs/plans/<slug>.md>
```

**The header states what the phase spent: `repairs <n>/3`** — the repair edits this phase made over its budget of three, printed on every failure report and on every success line a repaired phase produces. A phase that reaches `3/3` is a plan that was wrong, not a run that went quiet, and the count is the only mechanical signal of it.

**A diagnosis whose exact next action is an edit inside the plan is applied, never printed, while repair budget remains.** Printing an edit the contract allowed you to make hands the user back typing you had already done — the observed specimen ended a forty-minute run so a two-field fixture edit could be retyped by hand. If you can name the edit and the budget is not exhausted, make it, re-verify, and carry on.

**Zone 2 carries a 🔴 only when a user authority is at stake.** Four failures, and only four, reach zone 2 as a diagnosis: the repair budget is exhausted (three distinct causes spent, or this red's cause is one already repaired); the fix needs a criterion loosened, the scope changed, a stated limit exceeded or a known defect accepted, which is a 🔴 rather than a diagnosis; the exact action is a command only the user may invoke; or the cause is a plan line to correct. A failure whose fix needs no user authority reports in zone 2 the uncommitted paths, the failing output, the diagnosis and the exact next action, with no option set and no `AskUserQuestion`. When the fix does need one — a criterion loosened, the scope changed, a stated limit exceeded, a known defect accepted — you diagnosed it, so you are the only party who can turn it into a choice: a zone 2 reading "decide what to do about task 3" hands back the bill instead of the work.

<!-- decision-block:start -->
**Every 🔴 is a user-owned decision with two or three distinct options:**

> **🔴 <decision, ≤10 words, verb first>**
> - **Why yours:** <one line naming the missing user intent, preference or authorization>
> - **A · <label>** — <consequence, one line> — do: `<runnable command, or file:line → exact replacement>`
> - **B · <label>** — <consequence, one line> — do: `<same>`
> - **Leaning:** **A** — <≤12 words> · or **Leaning:** none — <what is missing>

No introductory or restating paragraph between these lines. If you cannot name distinct options, route substantive work as 🟡 to `/esq:plan` or drop it below the finding bar; "investigate/decide/review X" alone is not an option.

**Establish user ownership first.** Read the mandate, code, approved plan and Active decisions, then make one bounded search. Ask only for an unrecorded preference or authorization affecting product outcome, scope, a major architectural commitment, a stated constraint, or consequential cost/risk. Several viable approaches, uncertainty, UX/design or an absent decision are not sufficient: decide within the mandate and record it. Failures, red checks and missing evidence require diagnosis, never a choice between causes. A prior record authorizes only what its cited authority covers; an entry without a basis is context.

**Arbitrate constraints through `esq standards` first.** If its clause covers both the constraint class and the observed overrun, decide and record the constraint, observed value, clause and `Fondement: mandate — <the clause>`. Ask when the standard is silent, unreadable, exceeded, excludes that class, or the constraint is `(hard)`; disclose an unreadable standard.

**Each `do:` settles only the present decision and runs as written.** Put deferred work in the consequence. Keeping existing state requires verifying it and recording acceptance against the specific decision entry, with the evidence named. A user-only command remains that command alone, never an equivalent edit or shell call. Give a justified leaning, or name why none is possible; the user chooses. Never apply an option while presenting it or present one as already decided.
<!-- decision-block:end -->

A criterion that cannot be met without loosening it is exactly this — `Why yours:` a stated constraint: `A · keep the criterion, re-plan the approach — do: /esq:plan <slug>-fixes` against `B · loosen the criterion — do: <plan-file>:<line> → <the new criterion>`. Two candidate causes of a red test are not: that is a diagnosis to settle by investigating.

5. **Ask it, and act on the answer.**

<!-- decision-ask:start -->
**Put the decision to the user; do not print it and stop.** A printed decision costs a read, a hand-edit and a re-typed command. Fetch `ToolSearch "select:AskUserQuestion"` and ask:

- `question` — the decision line, verbatim
- `header` — ≤12 chars naming what is in dispute (`Fixture/max`)
- one entry per lettered option: `label` = its label, `description` = its consequence **and** its literal `do:` string, so the user sees exactly what will run
- the leaning goes **first** in the list with `(Recommended)` appended to its label; with no leaning, keep the author's order and append nothing

Never add an option the author didn't write, never add "you decide" or "skip", and never collapse two options into one. An option you invent is a guess put in the user's mouth.

**This does not dissolve the stop — it honors it in place.** Nothing proceeds without the user's answer; what disappears is the round-trip, not the authority. The `[authority]` gate still fires, still blocks, and still resolves only by the user choosing. A session that ends so the user can retype a string the command already computed was never protecting the decision.

**When the answer comes back, apply that option's `do:` and nothing else.** The user picking A is what converts A's `do:` from a proposal into an instruction: the informed agent wrote the string, the user authorized it, and executing a literal pre-approved change is not a judgment. Anything the answer does not literally say stays undone — you do not extend the fix, tidy around it, or apply the option you'd have picked.

**One round per gate.** If the same phase or step gates again after an applied option, stop and report — no second question. A decision that didn't hold is a finding, and asking twice is how unattended work turns into an interrogation.

**If `AskUserQuestion` is unavailable, print the block and stop.** Do not simulate the prompt, do not ask in prose, and do not pick.
<!-- decision-ask:end -->

You *are* the executor here, so you apply the chosen `do:` yourself — no subagent. Applying it spends one unit of the phase's repair budget. Verify before commit: re-run the verification step that failed, once, and every earlier PASS step the edit could affect; passing → commit it alone as `fix(<scope>): <the option's label>` and the phase continues from where it broke; failing → commit nothing, log nothing, leave the edits in the tree, report what didn't hold, and stop. A 🔴 found once the budget is exhausted is printed for the next invocation, not asked.

**Running under an orchestrator, you may find no `AskUserQuestion` to fetch.** That is the degraded path, and it is already handled: print the option set, stop, and let `/esq:autopilot` put it to the user and spawn the apply. Never treat its absence as licence to pick.

6. **Recovery routes**, only if neither an option nor the diagnosis above names the next action — generic, a fallback and never the headline, and none of them discards the edits or commits the failure left:
   - **Resume:** `/esq:build <plan>` — a new invocation, with a fresh repair budget, over the tree as it stands
   - **Fix in place:** correct it, commit the fix, then `/esq:check <plan>` to confirm the phase is actually done
   - **Amend the plan:** edit `docs/plans/<file>.md` directly, then re-run `/esq:build` from this phase
   - **Abandon:** `esq plan abandon <plan> --reason "<why>"`, then re-plan with `/esq:plan`; discarding kept edits or commits is the user's own act, never this command's

Do NOT append to the execution log on failure. The phase is incomplete.

Send a `PushNotification`: `"esq:build — Phase N failed at <task or verification step>: <one-line reason>"` — **before** the `AskUserQuestion` call, not after. A prompt waiting on someone who walked away is the same session-shaped wait it was meant to remove.

Stop only once the decision is spent: the user answered and their option was applied and re-verified, or there was no prompt to raise and the option set is printed. Never stop with a decision authored, `AskUserQuestion` available, and the question unasked. The two exceptions are a failure that needs no user authority, which stops on its diagnosis, and a 🔴 found once the budget is exhausted, which is printed.
