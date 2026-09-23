---
name: skill-authoring
description: The contract an esq skill must satisfy — read before editing or adding anything under plugin/skills/ or the README command table. Covers the frontmatter fields check-plugin.sh enforces, the in-body mandate guard vs disable-model-invocation, the named load a split skill owes, and the README table check-structure.sh holds exhaustive.
---

# Skill authoring — esquisse

What `./scripts/audit.sh` will fail you on when a skill changes. Reasoning: `docs/ARCHITECTURE.md § plugin/skills`.

## Rules

- **Edit `plugin/skills/<name>/SKILL.md` and nothing else** — it is the only corpus. A skill is one entrypoint plus its
  `references/`.
- **Frontmatter is a contract:** `name: <dir>`, `description:`, `model: opus|sonnet|haiku|inherit`,
  `effort: low|medium|high|xhigh|max`, and the body consumes `$ARGUMENTS` and `$0` (status excepted). `check-plugin.sh` asserts
  each. **There is no line cap and no skill count** — splitting into `references/` is a readability choice, not a way past a
  number.
- **`build check review fix work plan roadmap` carry the "No mandate, no run." in-body refusal and must NOT carry
  `disable-model-invocation`; every other skill MUST carry `disable-model-invocation: true`** — *why:* the flag blocks every
  Skill-tool call, including an orchestrator's delegated ones.
- **A procedure moved into `references/` is loaded by name at every branch that routes to it.** The entrypoint keeps the
  trigger, the authority stop and a named load of `${CLAUDE_SKILL_DIR}/references/<file>.md`; a reference that routes on to a
  second reference carries that load too. **The referenced path must exist** — `check-structure.sh` resolves every
  `references/…` mention. That a reached branch actually *carries* its load is `docs/AUDIT.md`'s reading pass, not a lexical
  check.
- **An entrypoint carries the rule and its condition; the evidence behind it stays in the record that already holds it.** The
  measurement, the session that produced it and the worked example are *cited* (`docs/DECISIONS.md § D-…`, the plan file)
  rather than recited at the point of the rule, while any figure that *decides* something — a bound, a threshold, a budget —
  stays in the entrypoint. **Incident histories, dated counts and `B-NNN` justifications do not belong in text paid on every
  run.** Cut rationale before you cut an obligation.
- **Announce the bound before the first tool call, and report what was spent at the end.** That is an instruction the skill
  honors, not a string a script greps. A command that runs long and states nothing is the defect; the fix is to write the
  bound, not to lint for it.
- **Resolving the CLI:** call `esq` from `PATH`; when `PATH` does not resolve it, use `"$CLAUDE_PLUGIN_ROOT/bin/esq"`. Stop only
  when neither runs. **Never write a prose fallback that recomputes what the CLI owns** — a ledger, a branch verdict, a context
  budget, an ID.
- **No `context: fork`** until a runtime proof exists.
- **Model policy in a skill:** pin `model: opus`; `status backlog epic sweep worktree` may be `sonnet`; the three orchestrators
  `autopilot converge advance` declare `model: inherit` and take the session's model. Every `Agent` spawn carries
  `model: opus`. **Nothing asserts afterwards whether the field was honored** — if it was not, the worker inherited the
  session's model, which the run reports in one line and never stops on.
- **A `description:` routes and nothing more** — mode and argument syntax live in the body and the README.
- **A paragraph two skills carry identically** may live inside `<!-- shared:<name>:start/end -->` markers as an authoring
  convenience. **Nothing verifies their equality any more**; if two carriers must differ, let them differ.
- **A command's tail commits its own bookkeeping once**: files one command owns in the same pass are staged together, while
  implementation commits stay one per task. **Git mutations are never issued side by side** — they contend for the index,
  `HEAD` and the working tree. That clause is a safety line; keep it wherever a skill issues more than one.
- **Every skill that concludes leads with the headline, then what needs the user, then the next action.** Three elements, no
  layout gate.
- **An orchestrator's gate routes every option's `do:` through `esq apply route` *before* it puts the question**, and spawns an
  apply agent on `route: apply` alone; `relay` prints the command flush-left and stops the gate — never invoking the restricted
  skill and never reaching the same end by its CLI call, a hand edit or a manual merge; `stop` spawns nothing. An apply worker
  commits only after its verification passes.
- **Adding a skill = one README table row.** Changing behavior means re-reading that command's prose section by hand — a table
  proves presence, not truth.
- **Ship it:** run the checks the change earns → commit → validate with `claude --plugin-dir ./plugin`. The plan's final phase
  runs `./scripts/audit.sh` and records its PASS. Never test the plugin by installing it.

## See also
`docs/ARCHITECTURE.md § plugin/skills`, `§ Key flows — A skill change ships`, and `docs/AUDIT.md` for the reading pass.
