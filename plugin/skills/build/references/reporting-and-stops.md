<!-- loaded-at: read `${CLAUDE_SKILL_DIR}/references/reporting-and-stops.md` and follow exactly the matching -->

<!-- conclusion:start -->
**Conclude in three zones, then `→ Next`; nothing before or after them.**

1. **Headline:** `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`. `✔` nothing needs the user; `⚠` something does; `✖` you could not do the job. Omit `NEEDS YOU` when empty. Any open gate makes the headline `⚠`.
2. **What needs the user:** omit on `✔`. Number each ask, action first, with its exact runnable command. Product choices use the 🔴 option set; copy manual verifications verbatim with their starting state bracketed first. Do not ask for work this command can perform itself.
3. **What happened:** one factual row per result — glyph, label, value, evidence. `✔` happened; `○` deliberately did not; `✖` failed. Collapse empty categories and unremarkable no-ops; never print `None.`. Explicitly name unperformed work the reader would otherwise assume happened.

Last line: `→ Next` with the first executable ask verbatim, or `pick an option in <n>, then <resume command>`, or the command that follows. No preamble, closing observations or extra headings.
<!-- conclusion:end -->

## On success

### Phase fully completed (no manual steps outstanding)

```
✔  build — <slug> · Phase 3/5 <name> · 4 commits · 12m · repairs <n>/3

  ✔ built      <one line: what the phase actually produced>
  ✔ verified   4 (auto) passed        tsc · vitest 332 · lint · build
  ✔ commits    a3f21c9, 8b40e11, c1d2e3f, 4a5b6c7
  ○ captured   B-164 B-165            <one clause each>
  ○ to close   B-41 B-44              /esq:backlog B-41 done  ← last phase only
  ○ remaining  Phases 4–5

→ Next: /clear, then /esq:build docs/plans/<slug>.md   (Phase 4)
        or /esq:autopilot docs/plans/<slug>.md — runs the remaining 2 unattended, stops at the first gate
```

Two lines are conditional and both must vanish rather than say "none": `captured` only when this phase filed candidates, `to close` only on the last phase and only when rows matched. The header's `repairs <n>/3` is conditional the same way: it appears only when this phase spent repair budget, and vanishes on a phase that spent none.

`→ Next` follows the same rule — one branch, never a menu:
- More phases remain → `/clear` and `/esq:build <plan-path>`. When **2 or more** remain, add the `/esq:autopilot` alternative on the second line, once.
- Last phase → `/clear`, then **`/esq:review <plan-path>`** in a fresh session — one reader for both questions, did it deliver what the work was for and is the code sound. Name the unattended alternative on the second line, at its real cost: `/esq:converge <plan-path>` — review, then fix what it found, at most two subagents, stopping at the first gate.

  `/esq:check <plan-path>` is not on this line. It is the deeper plan-versus-reality reconciliation, worth a session on a large plan or a suspected drift, and it is the user's to ask for — putting it here made every plan pay a second full reader before the one that decides landing.

  `/esq:arch` follows the review and is not part of that loop.

Send a `PushNotification`:
- More phases remain: `"esq:build — Phase N done. <M phases left>. Run /esq:build to continue."`
- Last phase: `"esq:build — all phases done. Run /esq:review <plan-path>. Then /esq:arch."`

Stop. **[context]** — this is the one stop in this command that exists because context accumulates, not because a decision is owed. See "Stop taxonomy".

### Phase paused for manual verification

```
⚠  build — <slug> · Phase 3/5 <name> · 4 commits · 12m · NEEDS YOU (2)

  1  [<starting state>] <the (manual) step, copied verbatim from the paused log entry>
  2  [<starting state>] <the second, same shape>

  ✔ built      <one line: what the phase actually produced>
  ✔ verified   4 (auto) passed        tsc · vitest 332 · lint · build
  ✔ commits    a3f21c9, 8b40e11, c1d2e3f, 4a5b6c7
  ✖ paused     phase is NOT done      code is committed, behavior is unproven
  ○ uncovered  the state link — no fixture creates the record; the result ask returned "couldn't get there"

→ Next: check the 2 steps above, then /clear and /esq:build docs/plans/<slug>.md
        (it resolves the pause first — do not skip to Phase 4; build won't let you)
```

The bracketed starting state is copied verbatim too — the step is unrunnable without it. The `uncovered` line is not optional — it names the link that stayed uncovered and what the result ask returned, which is what lets the user supply the one or answer the other. And the `✖ paused` glyph is deliberate: a phase whose code is committed still failed to prove itself, and a `✔` there is the misreading that ships unverified behavior.

Do NOT offer to drive the app as an alternative the user can request: if the project's resources covered this step's path, you were required to drive it before pausing.

Send a `PushNotification`: `"esq:build — Phase N paused: <count> manual check(s) needed before it's done."`

Stop.

## Stop taxonomy

Every stop in this command is one of two kinds. The distinction matters because an orchestrator running phases unattended (`/esq:autopilot`) may dissolve one kind and may never dissolve the other.

**[authority] — the user is owed a decision, or a diagnosis only their next invocation can act on. Always reaches them, in every mode.**

Reaching them is the requirement; *ending the session* never was. Where the decision has a real option set, put it to them with `AskUserQuestion` and act on what they choose — the gate still fires and still blocks, and only their answer opens it. Where it has no options, or no prompt is available, it stops the run as it always did.

- Every condition listed under "On failure" above that the recovery contract does not repair — a 🔴 when a user authority is at stake, otherwise a diagnosis with its exact next action.
- A `(manual)` step left unobserved because a link the observation needs is uncovered, closing it exceeded this phase's mandate or failed inside its bound, and neither this run nor the user has observed the result.
- Drift the Drift clause cannot separate from work that was already in the tree or that another actor wrote.
- The user confirmed a paused phase — that round-trip was the session's work.
- No plan file, invalid path, or all phases already complete.
- A **second** reconcilable phase in one invocation — one reconciliation is a bookkeeping repair, two back to back is a state nobody intended, and only the user can say whether the run should continue through it.

**[context] — nothing is owed to anyone; the session is simply spent. Exactly one:**

- The end-of-a-successful-phase stop ("run `/clear` and `/esq:build` again for Phase N+1"). Its whole purpose is to give the next phase a clean context. A fresh subagent already has one, so an orchestrator may continue past it.

If you add a stop to this command, classify it here. An unclassified stop defaults to `[authority]` — the safe direction, since treating a real gate as ritual is how unattended work goes wrong.

