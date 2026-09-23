<!-- loaded-at: `${CLAUDE_SKILL_DIR}/references/refuse-a-branch.md`: you MUST load it before you write the refusal -->
## Refuse a branch this plan does not own

Reached only from preflight step 3, on `refuse: true`. Nothing has been read and nothing written, and nothing will be: this is an **authority** stop. Build never picks a branch for the user, never runs a `git switch` itself, and never edits the plan's `**Branch:**` field to make itself proceed — that field is `/esq:plan`'s, single-writer **among commands**, and rewriting it here would convert a guard into a rubber stamp. The rule binds commands, never the human: your own edit to your own plan header is the escape, and it is the second step option A asks you for.

Hand the decision back as an option set, in this shape and no other. The verdict supplies every value in it: `reason` is the opener, `branch` and `recorded` fill the `git switch` lines, `owners[].file` and `owners[].merged` name the conflict, and the plan's filename slug is the fresh-branch name.

```
**Decision — <one line: this branch is <branch>, and this plan <recorded <recorded> | is owned by <owners[0].file>>.>**
Yours because it settles which item this commit range belongs to, and only you know whether this branch is meant to carry this plan's work.

A. Start this plan's own branch.
   Consequence: the phases commit somewhere nothing else claims; <branch> keeps whatever it already carries.
   do: git switch -c esq/<plan-slug>
   then: unless the plan header's **Branch:** field already names that branch, edit it to esq/<plan-slug> yourself and re-run /esq:build <plan-path> — the switch alone leaves the header naming the branch that was just refused.
B. Continue on the branch this plan recorded.   [mismatch only]
   Consequence: the phases land where the plan says they land; whatever is uncommitted here comes with you.
   do: git switch <recorded>
C. Record the reuse deliberately.
   Consequence: <branch> ends up owning two plans' work, which is exactly the history B-102 was filed for — take it only when the two are one shipping unit.
   do: edit the plan header's **Branch:** field to <branch> yourself, then re-run /esq:build <plan-path>

Leaning: <A on `mismatch` where the recorded branch no longer exists, B on `mismatch` where it does, A on `owned-elsewhere`.>
```

Three verdicts arrive here, and each shifts the wording, never the shape:

- **`mismatch`** — the plan recorded a branch, HEAD is on another. Name both. All three options apply; B is the leaning whenever `recorded` still exists as a ref, because the plan already said where its work goes.
- **`owned-elsewhere`** — a *different* plan recorded this branch. Name that plan's path and whether its work is already merged into the origin that plan itself records, as a fact about how confusing the reuse would be — it is not what decided the refusal, since ownership alone does. Drop options B *and* C, and lean A: this verdict only fires where the plan already records `<branch>`, so returning to the recorded branch and recording the reuse are both no-ops — the claim being refused is the other plan's. A is the only escape the rule leaves, and neither of its halves clears the gate alone: the `git switch -c` without the header edit refuses again as `mismatch`, and the header edit without the switch leaves HEAD on the contested branch. Give both steps.
- **`detached`** — HEAD is on no branch at all. There is nothing to reuse and nothing to record, so the option set collapses to A, plus returning to whatever branch the user left (`git switch -`).

Then stop. Do not re-run the check hoping for a different verdict, do not start the phase, and do not fall through to "Identify the next phase".
