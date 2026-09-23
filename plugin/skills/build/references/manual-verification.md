<!-- loaded-at: `${CLAUDE_SKILL_DIR}/references/manual-verification.md`: you MUST load it before you resolve the pause -->
<!-- loaded-at: **This phase's verification names a genuinely `(manual)` step** → `${CLAUDE_SKILL_DIR}/references/manual-verification.md` -->
<!-- loaded-at: In the plugin it is `${CLAUDE_SKILL_DIR}/references/manual-verification.md`, loaded under "Conditional references" above -->
## Observe the `(manual)` steps

There is exactly one way to settle a manual step, and this is it. Both the end-of-phase verification and "Resolve a paused phase" run this same procedure — the behavior the user sees must not depend on which one they're in.

**The default is that you observe it. A pause is the last resort, not the handoff.**

### 1. Probe for an instrument — mandatory, and it is a tool call

**Never state that no browser-driving tool is available without having probed for one in this session.** Assuming absence converts a check you could have done in 90 seconds into a session-ending pause.

- Scan the available-skills listing for `run`, `verify`, or any project skill that launches this app.
- `ToolSearch "browser screenshot playwright navigate click"` — a browser-driving MCP server (Playwright, Puppeteer, chrome-devtools) is a first-class instrument for exactly these steps.
- Fetch `ToolSearch "select:Skill,AskUserQuestion"` — `Skill` to invoke the driver; `AskUserQuestion` for the step-3 fallback and for any decision this run has to put to the user (see "On failure").

### 2. If you have an instrument, drive it — don't ask permission first

Launch the app, drive each step to its starting state, observe the real result, and record the evidence the tool gives you (screenshot, DOM text, rendered value). Then mark each step PASS or FAIL yourself and keep going.

**Do not put your own observation to the user as a question.** Report each step with its evidence in your final message — the user can veto after the fact, which is cheap. A blocking question is not.

If the driver won't launch (no dev server, missing dep, build error), that's one attempt, not a debugging project. **A launch that fails is an uncovered access link, never a question for the user: say why in one line, then take it to the coverage criterion below and settle it under item 2 of the disposition.**

**The criterion is scenario coverage, link by link — never the presence of an instrument.** Ask of the project's resource set whether it covers *this* step: access, a starting state that can actually be created, the action, the observation. A found skill covers only the links it covers — one that launches the app but cannot create the record the step observes leaves the state link uncovered, and a script that writes the artifact but reads nothing back off it leaves the observation link uncovered. An access link is uncovered the same way when the resource that should supply it fails on its own environment: an invocation that opens by installing something which then has to be reverted, or that makes you assemble a path a script could have computed about itself, is a link the project does not cover — name the line you had to undo or hand-assemble.

Improvising a path is the most expensive thing an unattended phase does — resolving the dev server's port, the database credentials, the seed path, an authenticated fixture, then hand-writing a harness — and the scratchpad it lives in does not survive the session, so the next plan pays for it again from zero. Measured on a four-phase run: the first phase needing a live app cost 155 tool calls against 63 and 86 for the two backend phases before it, with every file it touched already named in the plan. The gap was the environment, not the code. So the disposition below is owed whether the path was found or improvised, and no instrument you happened to find waives any of it:

1. **A recipe actually used is preserved in the execution log's `For Phase N+1` note** — ports, the command that brings infrastructure up, how a fixture gets seeded and authenticated, where the harness file is. That is a gotcha the next phase relies on, which is exactly what that note is for, and a found recipe earns it as much as an invented one: the next session probes the project, not this transcript.
2. **An uncovered blocking link is closed inside the mandate and bounds this phase already has when the plan provides for it or the mandate permits it, and committed with the phase; when it exceeds that mandate or fails inside the bound that already exists, the run preserves its evidence and edits under the current rules, declares no PASS, and takes the existing blocked or failure exit carrying the diagnosis and the exact next action.** No implicit scope extension, no troubleshooting loop, and no technical diagnostic question put to the user. **The diagnosis is recorded in the pause entry, so a resume reads it rather than re-deriving it, and a complement the entry already records as exceeding the mandate or as having failed inside its bound is not re-attempted — a new invocation does not reset that bound.**
3. **A backlog row remains only for a genuinely optional future improvement** — a project run/verify skill worth having beyond what this plan's own steps needed. **Neither a backlog row nor the existence of a script is the observation.** A row is closed when some plan ships; the step is settled only when someone or something has looked.

### 3. Ask — only about the result, and only once item 2 is spent

**An absent or broken instrument reaches this step as an engineering question never, and as a *result* only once item 2 is spent — the complement exceeded this phase's mandate or failed inside the bound it already had — and the user can reach what this run could not.** Genuine personal judgment, and access only the user holds, are asked about the *result* — never about how to build an instrument. An absent resource is an uncovered link handled by item 2 above, and it is never converted into an engineering questionnaire put to the user.

Present each step verbatim with its starting state. Use `AskUserQuestion`, one question per step, options PASS / FAIL / couldn't get there. **This is the only case in the whole command where you ask the user about a verification result.**

**Nothing is invented and nothing is asked twice.** A user who answers "couldn't get there", or does not answer at all, leaves that step unobserved: the observation is never fabricated, the same question is not put a second time in this invocation, and the phase pauses under the clause below.

### 4. Settle

- **All PASS** → the phase is verified. Record one line of evidence per step, naming the instrument (`/run`, Playwright, "user confirmed") — in this phase's own `esq plan append-log` entry when the steps were observed at the end of the phase, or in `esq plan resolve-block --confirm`'s `manual` when they settle a pause, which renders them under `**Manual verification:** confirmed <YYYY-MM-DD>`. Never by hand, in either case.
- **Any FAIL** → the phase is not done and the implementation is wrong. Treat it as a failure (see "On failure").

**Neither a FAIL nor a failed repair is ever a pause or a manual confirmation.** A pause records a result nobody could observe; a FAIL records a result observed to be wrong; a failed repair leaves the phase in the failure report with its edits uncommitted. Three distinct exits, and none of them stands in for another.

  Load `${CLAUDE_SKILL_DIR}/references/failure-and-recovery.md` here, before the report, exactly as "On failure" requires.

Never mark a manual step PASS without an actual observation — yours or the user's. That rule is what keeps "tests pass" from masquerading as "the feature works," and nothing above relaxes it.

## Resolve a paused phase

A phase is paused when its last build run committed the code and passed every `(auto)` step, but left `(manual)` steps unobserved. Its execution-log entry is headed `⏸ awaiting manual verification`, and it carries the `**Verified:**` block that pass earned — which is why settling it here costs no rerun. Resolve it before any new phase runs. **Nothing on this path re-executes the phase**, and nothing here re-runs a command git can still prove green.

1. **Read** the paused entry's `**Manual verification outstanding:**` list — each step with its starting state, and the exact string you will copy back into the confirmation below. Preflight's `⏸` slice is that entry in full, so the list is already in front of you; open the file again only if the slice is somehow missing it.
2. **Run "Observe the `(manual)` steps" above.** Probe again here: the previous run may have paused precisely *because* it skipped the probe. **An explicit user observation still valid for that step settles it through `resolve-block --confirm` with `user confirmed` as the instrument, and is not discarded because the probe still finds no driver.** An entry that records no diagnosis has not been diagnosed: item 2 of the disposition runs once over it, which is what makes a pause created before this unit resolvable.
3. **All PASS** → **the transition is `esq plan resolve-block`, never an edit.** The entry is machine-written and this run now holds the fact that releases it, so the flip is a CLI write that refuses rather than a header you rewrite by hand — and every refusal leaves the plan file byte-identical, which is what makes these four steps safe to re-enter after an interruption.
   1. **Ask** — `esq plan resolve-block <plan-path>`, read-only, writes nothing, safe to run twice. `refuse: false` carries `owed`, the `(auto)` commands git can no longer prove still green — normally none, because the pause recorded what proved it — and `verify.unresolved`, the steps whose command cannot be recovered from their own prose. `refuse: true` names a state no rerun changes (`blockers-open`, `verification-owed`, `already-resolved`, `malformed-entry`): report its `reason` verbatim and stop.
   2. **Run what the ask says is owed, and nothing else.** Each command in `owed` exactly once, plus each entry in `verify.unresolved` in full. Everything in neither list is evidence this phase already bought and its entry still carries — re-running it buys a fact already in hand. Judge each result against its own `step` text and never against exit 0. **Any red** → leave that command out of the payload below; its absence is what holds the pause.
   3. **Confirm the observation** — `esq plan resolve-block <plan-path> --confirm '<json>'`. The payload is `{"phase": N, "manual": [{"step": "<one outstanding step, copied exactly as the entry lists it>", "observed": "<what you saw, and the instrument that saw it>"}, …]}` — one entry per outstanding step — plus, when anything ran, `verified` and `verification` in the shape the blocked resolution passes them. **A step you did not observe, or observed FAIL, is one you leave out of `manual`, and leaving it out is exactly what keeps the phase paused**: the CLI refuses the payload, names the unsettled steps, and the plan file is unchanged. No `(auto)` result stands in for an observation, and there is no payload that says a step passed without one.
   4. **Commit the plan file alone**, chained in one call: `git add <plan-file-path> && git commit -m "plan(<slug>): confirm phase N manual verification"`.

   What happens next depends on one thing only — who did the observing:
   - **You observed it yourself** (an instrument, no question asked): settling the pause implemented no task and wrote no code, so it does not consume this invocation's phase budget. Say so in one line and **continue straight into the next phase** in this same session.
   - **The user confirmed it**: STOP. That round-trip was this session's work. Do NOT run "Write decisions to DECISIONS.md", do NOT start the next phase. Tell them: "Phase N is confirmed complete. Run `/clear` and `/esq:build <plan-path>` to execute Phase N+1." Then stop.
4. **Any FAIL** → do NOT confirm. Report what failed and what you observed, and treat it as a failure (see "On failure"). Leave the `⏸` entry as-is — omitting the step from `manual`, or making no confirm call at all, is how it stays.

   Load `${CLAUDE_SKILL_DIR}/references/failure-and-recovery.md` here, before the report, exactly as "On failure" requires.
