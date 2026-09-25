# Write and record the plan contract

Loaded after preparation when this run will write a plan file. The entrypoint owns
choices, authority and verification; this reference owns their file format and recording.

## Name the file

Use today's date in YYYY-MM-DD and the target slug for `docs/plans/<YYYY-MM-DD>-<slug>.md`.
If the file exists, append `-2` (then `-3`, etc.) to the slug until unique. Ensure
`docs/plans/` exists. This uniquifies the file, never an existing target branch.

## Write the plan file

Use this exact structure. The `## Execution log` section MUST be present (initially empty) — it's the contract with `/esq:build`.

```
# <Title in plain English, not a slug>

<!-- Include the next line ONLY if this plan belongs to an epic (chosen during preflight). -->
**Epic:** <epic-slug>

<!-- Omit BOTH of the next two fields ONLY on a detached HEAD or outside a git repository. -->
**Branch:** <the branch this plan's phases commit to>

**Origin:** <the branch it was cut from, and the branch it lands back on>

## Context
What's the situation. Current state. Why this is on the table now.
2-4 sentences of prose.

## Goal
One sentence: what does success look like, observable from outside. Name what a person
can do after this that they couldn't before — that is the value this plan delivers.
If the outcome is genuinely invisible to users (migration, infrastructure, tooling), say
so plainly and name the user-facing work it unblocks, and when that work happens.

## Done looks like
<!-- Carried from the brief's `## Done looks like` when there is one; written here when
     there isn't. This is the plan's answer to "what question was I asked?" — /esq:check
     reads it back against what shipped. Never delete it; a plan without it can only be
     audited against itself. -->
The observable conditions that would make the person who asked for this consider it done —
in their terms, not the implementation's. Not "the endpoint returns 200" but "a customer
whose card fails gets told why, and can fix it without contacting support."
If the work is genuinely invisible to users, state the condition that proves the *unblocked*
work is now possible.

## Approaches considered
The viable approaches and their user benefit, cost and decisive limitation, as settled during preparation.

## Recommendation
Which approach and why. Be direct. Reference the tradeoffs above. If the answer depends on something the user must decide, surface it as an open question instead of picking arbitrarily.
Where outside practice settled a choice, cite it in one line — source and the date you checked — so
a later session can tell a researched pick from a remembered one.

## Security notes
<!-- Include this section ONLY when the change crosses a trust boundary: untrusted input,
     authn/authz, secrets, one user's data, an external call, a new public surface.
     Omit it entirely otherwise — security theater on a change that crosses nothing is noise. -->
The boundary this change crosses and how it's held: who is allowed to call it, what is
validated and where, what must never be logged or returned. One short paragraph, concrete.

## Phases

The sequential, usable phases settled during preparation.

### Phase 1 — <name>
- **Goal:** one sentence
- **Files touched:** explicit paths
- **Tasks:**
  - Task 1.1: <one commit's worth of work, written as the commit subject would read>
  - Task 1.2: <next atomic change>
  - (One atomic commit per task; size the phase by its deliverable and session context.)
- **Verification:** observable. Tag each step `(auto)` or `(manual)` — see the entrypoint’s Verification discipline. Examples:
  - `(auto)` `curl -sS localhost:3000/health` returns HTTP 200
  - `(auto)` `pnpm test src/api/users.test.ts` passes
  - `(auto)` `grep -r "deprecated_function" src/` returns no results
  - `(auto)` `node --test 'tests/cli/*.test.mjs'` — the CLI suite passes
  - `(manual)` [logged out, incognito] Open `/signup`, complete checkout with Stripe test card `4242 4242 4242 4242`, observe redirect to `/dashboard` showing an active subscription badge

### Phase 2 — <name>
[same shape]

[continue for all phases. Single-phase plans are fine — say so plainly.]

## Risks
What could go wrong specifically with THIS plan. Not generic risk theater. What you'd watch for during execution.

## Open questions
Things you couldn't decide without more input. Be specific about what would resolve each one.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
```

The `<!-- comment -->` after `## Execution log` is required — it signals to `/esq:build` that this section is reserved.

## Record the picked-up work

Use `esq backlog set-status <B-NNN> Planned` for the rows selected during preflight,
appending ` · Planned by <this-plan-slug>` to Source. Update only the row; strip any
legacy detail `**Status:**` rather than maintaining it. Fill blank Epic cells with
the chosen epic slug, if any. These edits share the plan's single tail commit.
Use `esq backlog reserve-id` for any new backlog row.

## Write decisions to registry

Only significant choices belong in `docs/DECISIONS.md`: a recommendation between real
alternatives or a resolved user decision. If there is no such choice, skip this step.
Otherwise load `${CLAUDE_SKILL_DIR}/references/decisions.md` for the record format.
Search only relevant existing decisions; never turn feature planning into a historical
registry migration.

## Commit and stop

After writing the plan file and updating DECISIONS.md (if applicable), read the written
contract once to ensure it carries the prepared choices and verification:

1. **Cut the shipping unit, and fill both fields from it**, here and not earlier.
   Pass refs as quoted Git arguments. Preserve any pre-existing dirty work and stage only this command's writes.
   For corrective input, obtain `esq branch resolve <slug>` here; never derive identity from suffixes.
   An existing target branch is an ambiguity: stop and name it, never attach or uniquify around it; an explicit `reuse` is different.
   `git branch --show-current`, run once: that is `**Origin:**`. Then `git switch -c esq/<slug>`
   from it, and that name is `**Branch:**`. Write both into the plan file's header before staging. Empty output means detached HEAD, and a non-zero exit means no git repository: in both
   cases create no branch, omit both fields, and carry the reason into step 4.
   With no repository, skip staging and commit. A corrective plan does
   what `esq branch resolve <slug>` answered — `reuse` copies the two fields and creates nothing, `new`
   cuts from the stem's `**Origin:**`; an `esq/<slug>` that already exists stops the command here.
2. **Stage this command's whole tail in one call**, naming only the files this run actually wrote: `git add docs/plans/<filename>` always, plus `docs/DECISIONS.md` if you updated it and `docs/BACKLOG.md` if this run flipped any row to `Planned`. Never stage a file this run did not write — with one exception. **A corrective brief you planned is retired in this same commit.** From the `*-fixes*.brief.md` you planned, strike the `## 🟡 Needs a plan` section and every 🔴 item this run resolved through `AskUserQuestion`; when no 🟢, 🟡 or 🔴 item remains, `git rm` the brief, otherwise `git add` it with the rest intact — an unapplied 🟢 is still `/esq:fix`'s and an open 🔴 is still the user's. Never a grill brief, and never a brief this run did not plan. The why is `D-plan-retires-the-brief-it-plans`: `unit.findings` counts every corrective brief still on disk.
3. Run `esq validate` before committing. Then `git commit -m "plan: <slug>"` — **one** commit, not two: `/esq:plan` owns every one of these files in this one pass, and reverting the plan must revert the status flip it caused.
4. Tell the user:
   - The file path
   - **The shipping unit it created** — two lines, `Branch: esq/<slug>` and `Origin: <name>` — or,
     when the fields were omitted, which condition omitted them (detached HEAD, or no git
     repository) and that `/esq:build` will therefore treat the plan as legacy: it refuses
     nothing, and it never lands.
   - One-sentence summary of the recommendation
   - Suggested next step. **A plan with 2+ phases has two ways to execute, and the user picks — name both:**
     - Always: "Review the plan in your editor. When ready, `/clear` and run `/esq:build <plan-path>` to execute Phase 1."
     - When the plan has 2 or more phases, add: "Or `/esq:autopilot <plan-path>` to run all <N> phases unattended — it stops at the first gate that needs you. Cap the first run (`/esq:autopilot <plan-path> 2`) if you'd rather watch a couple land first."
     - A single-phase plan: `/esq:build` only. Orchestrating one phase is pure overhead.
   - **Elapsed, last, on its own line** — `8m14s`, measured against the preflight announcement. One number, not a report.
5. Stop. Do not execute anything beyond the plan file write.
